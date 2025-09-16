import Stripe from 'stripe';

// Configuração do Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
});

// Configuração do Stripe no cliente
export const getStripe = async () => {
    if (typeof window !== 'undefined') {
        const { loadStripe } = await import('@stripe/stripe-js');
        return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
    }
    return null;
};

// Tipos para pagamentos
export interface PaymentPlan {
    id: number;
    name: string;
    description: string;
    price_usd: number;
    price_brl: number;
    credits_included: number;
    stripe_price_id_usd?: string;
    stripe_price_id_brl?: string;
}

export interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: string;
    client_secret: string;
}

// Função para criar Payment Intent
export async function createPaymentIntent(
    planId: number,
    currency: 'usd' | 'brl',
    userId: number
): Promise<PaymentIntent> {
    try {
        // Buscar plano no banco de dados
        const plan = await getPaymentPlan(planId);
        if (!plan) {
            throw new Error('Plano não encontrado');
        }

        const amount = currency === 'usd' ? plan.price_usd : plan.price_brl;
        const stripePriceId = currency === 'usd' 
            ? plan.stripe_price_id_usd 
            : plan.stripe_price_id_brl;

        if (!stripePriceId) {
            throw new Error(`Price ID não configurado para ${currency.toUpperCase()}`);
        }

        // Criar Payment Intent no Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe usa centavos
            currency: currency,
            metadata: {
                plan_id: planId.toString(),
                user_id: userId.toString(),
                credits_included: plan.credits_included.toString()
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            client_secret: paymentIntent.client_secret!
        };

    } catch (error) {
        console.error('Erro ao criar Payment Intent:', error);
        throw error;
    }
}

// Função para buscar plano de pagamento
async function getPaymentPlan(planId: number): Promise<PaymentPlan | null> {
    try {
        const { default: MySQLDatabase } = await import('./mysql-db');
        const db = new MySQLDatabase();
        await db.connect();

        const [plans] = await db.connection.execute(`
            SELECT 
                id,
                name,
                description,
                price_usd,
                price_brl,
                credits_included,
                stripe_price_id_usd,
                stripe_price_id_brl
            FROM payment_plans 
            WHERE id = ? AND is_active = true
        `, [planId]);

        await db.disconnect();

        if (!Array.isArray(plans) || plans.length === 0) {
            return null;
        }

        return plans[0] as PaymentPlan;
    } catch (error) {
        console.error('Erro ao buscar plano de pagamento:', error);
        return null;
    }
}

// Função para confirmar pagamento
export async function confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        return paymentIntent.status === 'succeeded';
    } catch (error) {
        console.error('Erro ao confirmar pagamento:', error);
        return false;
    }
}

// Função para processar webhook do Stripe
export async function handleStripeWebhook(event: Stripe.Event) {
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            await handlePaymentSuccess(paymentIntent);
            break;
        
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object as Stripe.PaymentIntent;
            await handlePaymentFailure(failedPayment);
            break;
        
        default:
            console.log(`Evento não tratado: ${event.type}`);
    }
}

// Função para processar pagamento bem-sucedido
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    try {
        const { plan_id, user_id, credits_included } = paymentIntent.metadata;
        
        console.log(`Pagamento bem-sucedido: ${paymentIntent.id}`);
        console.log(`Usuário: ${user_id}, Plano: ${plan_id}, Créditos: ${credits_included}`);
        
        const { default: MySQLDatabase } = await import('./mysql-db');
        const db = new MySQLDatabase();
        await db.connect();

        // 1. Atualizar status do pagamento no banco
        await db.connection.execute(`
            UPDATE payments 
            SET status = 'succeeded' 
            WHERE stripe_payment_intent_id = ?
        `, [paymentIntent.id]);

        // 2. Adicionar créditos ao usuário
        const credits = parseInt(credits_included);
        
        // Verificar se usuário já tem registro de créditos
        const [existingCredits] = await db.connection.execute(`
            SELECT id FROM user_credits WHERE user_id = ?
        `, [user_id]);

        if (Array.isArray(existingCredits) && existingCredits.length > 0) {
            // Atualizar créditos existentes
            await db.connection.execute(`
                UPDATE user_credits 
                SET 
                    credits_balance = credits_balance + ?,
                    total_credits_earned = total_credits_earned + ?
                WHERE user_id = ?
            `, [credits, credits, user_id]);
        } else {
            // Criar novo registro de créditos
            await db.connection.execute(`
                INSERT INTO user_credits (user_id, credits_balance, total_credits_earned)
                VALUES (?, ?, ?)
            `, [user_id, credits, credits]);
        }

        // 3. Registrar transação de créditos
        await db.connection.execute(`
            INSERT INTO credit_transactions 
            (user_id, transaction_type, amount, description, related_payment_id)
            VALUES (?, 'earned', ?, 'Créditos adquiridos via pagamento', 
                (SELECT id FROM payments WHERE stripe_payment_intent_id = ?))
        `, [user_id, credits, paymentIntent.id]);

        await db.disconnect();
        
        console.log(`✅ Créditos adicionados com sucesso: ${credits} para usuário ${user_id}`);
        
    } catch (error) {
        console.error('Erro ao processar pagamento bem-sucedido:', error);
    }
}

// Função para processar pagamento falhado
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    try {
        console.log(`Pagamento falhado: ${paymentIntent.id}`);
        
        const { default: MySQLDatabase } = await import('./mysql-db');
        const db = new MySQLDatabase();
        await db.connect();

        // 1. Atualizar status do pagamento no banco
        await db.connection.execute(`
            UPDATE payments 
            SET status = 'failed' 
            WHERE stripe_payment_intent_id = ?
        `, [paymentIntent.id]);

        await db.disconnect();
        
        console.log(`❌ Status do pagamento atualizado para 'failed': ${paymentIntent.id}`);
        
    } catch (error) {
        console.error('Erro ao processar pagamento falhado:', error);
    }
}
