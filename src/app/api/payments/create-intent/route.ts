import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { createPaymentIntent } from '@/lib/stripe';
import MySQLDatabase from '@/lib/mysql-db';

// POST /api/payments/create-intent - Criar Payment Intent do Stripe
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            );
        }
        const body = await request.json();
        const { plan_id, currency } = body;

        if (!plan_id || !currency) {
            return NextResponse.json(
                { success: false, error: 'Campos obrigatórios: plan_id, currency' },
                { status: 400 }
            );
        }

        if (!['usd', 'brl'].includes(currency)) {
            return NextResponse.json(
                { success: false, error: 'Moeda deve ser "usd" ou "brl"' },
                { status: 400 }
            );
        }

        // Buscar plano no banco de dados
        const db = new MySQLDatabase();
        await db.connect();

        const [plans] = await db.connection.execute(`
            SELECT 
                id,
                name,
                price_usd,
                price_brl,
                credits_included,
                stripe_price_id_usd,
                stripe_price_id_brl
            FROM payment_plans 
            WHERE id = ? AND is_active = true
        `, [plan_id]);

        if (!Array.isArray(plans) || plans.length === 0) {
            await db.disconnect();
            return NextResponse.json(
                { success: false, error: 'Plano não encontrado ou inativo' },
                { status: 404 }
            );
        }

        const plan = plans[0] as {
            id: number;
            name: string;
            price_usd: number;
            price_brl: number;
            credits_included: number;
            stripe_price_id_usd: string;
            stripe_price_id_brl: string;
        };
        const stripePriceId = currency === 'usd' 
            ? plan.stripe_price_id_usd 
            : plan.stripe_price_id_brl;

        if (!stripePriceId) {
            await db.disconnect();
            return NextResponse.json(
                { success: false, error: `Price ID não configurado para ${currency.toUpperCase()}` },
                { status: 400 }
            );
        }

        // Criar Payment Intent
        const paymentIntent = await createPaymentIntent(plan_id, currency, user.id);

        // Salvar transação no banco
        await db.connection.execute(`
            INSERT INTO payments 
            (user_id, plan_id, stripe_payment_intent_id, amount_usd, amount_brl, currency, status, credits_granted)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        `, [
            user.id,
            plan_id,
            paymentIntent.id,
            plan.price_usd,
            plan.price_brl,
            currency,
            plan.credits_included
        ]);

        await db.disconnect();

        return NextResponse.json({
            success: true,
            payment_intent: {
                id: paymentIntent.id,
                client_secret: paymentIntent.client_secret,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency
            },
            plan: {
                id: plan.id,
                name: plan.name,
                credits_included: plan.credits_included
            }
        });

    } catch (error) {
        console.error('Erro ao criar Payment Intent:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
