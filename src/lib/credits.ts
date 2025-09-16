import MySQLDatabase from './mysql-db';

export interface CreditsBalance {
    credits_balance: number;
    total_credits_earned: number;
    total_credits_used: number;
    last_updated: string;
}

export interface CreditTransaction {
    id: number;
    transaction_type: 'earned' | 'used' | 'refunded';
    amount: number;
    description: string;
    created_at: string;
    related_payment_id?: number;
    related_generation_id?: number;
}

/**
 * Obter saldo de créditos de um usuário
 */
export async function getUserCredits(userId: number): Promise<CreditsBalance | null> {
    try {
        const db = new MySQLDatabase();
        await db.connect();

        const [credits] = await db.connection.execute(`
            SELECT 
                credits_balance,
                total_credits_earned,
                total_credits_used,
                last_updated
            FROM user_credits
            WHERE user_id = ?
        `, [userId]);

        await db.disconnect();

        if (!Array.isArray(credits) || credits.length === 0) {
            return null;
        }

        return credits[0] as CreditsBalance;
    } catch (error) {
        console.error('Erro ao buscar créditos do usuário:', error);
        return null;
    }
}

/**
 * Verificar se usuário tem créditos suficientes
 */
export async function hasEnoughCredits(userId: number, requiredCredits: number): Promise<boolean> {
    const credits = await getUserCredits(userId);
    return credits ? credits.credits_balance >= requiredCredits : false;
}

/**
 * Usar créditos de um usuário
 */
export async function useCredits(
    userId: number, 
    creditsToUse: number, 
    description: string,
    generationId?: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
        const db = new MySQLDatabase();
        await db.connect();

        // Verificar saldo atual
        const [currentCredits] = await db.connection.execute(`
            SELECT credits_balance FROM user_credits WHERE user_id = ?
        `, [userId]);

        let currentBalance = 0;
        if (Array.isArray(currentCredits) && currentCredits.length > 0) {
            currentBalance = (currentCredits[0] as { credits_balance: number }).credits_balance;
        }

        if (currentBalance < creditsToUse) {
            await db.disconnect();
            return {
                success: false,
                error: `Créditos insuficientes. Disponível: ${currentBalance}, Necessário: ${creditsToUse}`
            };
        }

        const newBalance = currentBalance - creditsToUse;

        // Atualizar ou criar registro de créditos
        if (Array.isArray(currentCredits) && currentCredits.length > 0) {
            await db.connection.execute(`
                UPDATE user_credits 
                SET 
                    credits_balance = ?,
                    total_credits_used = total_credits_used + ?
                WHERE user_id = ?
            `, [newBalance, creditsToUse, userId]);
        } else {
            await db.connection.execute(`
                INSERT INTO user_credits (user_id, credits_balance, total_credits_used)
                VALUES (?, ?, ?)
            `, [userId, newBalance, creditsToUse]);
        }

        // Registrar transação
        await db.connection.execute(`
            INSERT INTO credit_transactions 
            (user_id, transaction_type, amount, description, related_generation_id)
            VALUES (?, 'used', ?, ?, ?)
        `, [userId, creditsToUse, description, generationId]);

        await db.disconnect();

        return {
            success: true,
            newBalance
        };

    } catch (error) {
        console.error('Erro ao usar créditos:', error);
        return {
            success: false,
            error: 'Erro interno do servidor'
        };
    }
}

/**
 * Adicionar créditos a um usuário (usado após pagamento)
 */
export async function addCredits(
    userId: number,
    creditsToAdd: number,
    description: string,
    paymentId?: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
        const db = new MySQLDatabase();
        await db.connect();

        // Verificar se usuário já tem registro de créditos
        const [existingCredits] = await db.connection.execute(`
            SELECT credits_balance FROM user_credits WHERE user_id = ?
        `, [userId]);

        let newBalance = creditsToAdd;
        if (Array.isArray(existingCredits) && existingCredits.length > 0) {
            const currentBalance = (existingCredits[0] as { credits_balance: number }).credits_balance;
            newBalance = currentBalance + creditsToAdd;

            await db.connection.execute(`
                UPDATE user_credits 
                SET 
                    credits_balance = ?,
                    total_credits_earned = total_credits_earned + ?
                WHERE user_id = ?
            `, [newBalance, creditsToAdd, userId]);
        } else {
            await db.connection.execute(`
                INSERT INTO user_credits (user_id, credits_balance, total_credits_earned)
                VALUES (?, ?, ?)
            `, [userId, creditsToAdd, creditsToAdd]);
        }

        // Registrar transação
        await db.connection.execute(`
            INSERT INTO credit_transactions 
            (user_id, transaction_type, amount, description, related_payment_id)
            VALUES (?, 'earned', ?, ?, ?)
        `, [userId, creditsToAdd, description, paymentId]);

        await db.disconnect();

        return {
            success: true,
            newBalance
        };

    } catch (error) {
        console.error('Erro ao adicionar créditos:', error);
        return {
            success: false,
            error: 'Erro interno do servidor'
        };
    }
}

/**
 * Calcular custo em créditos baseado no uso da API
 */
export function calculateCreditsFromUsage(usage: {
    input_tokens_details?: {
        text_tokens?: number;
        image_tokens?: number;
    };
    output_tokens?: number;
} | null | undefined): number {
    if (!usage || !usage.input_tokens_details || usage.output_tokens === undefined) {
        return 1; // Custo mínimo de 1 crédito
    }

    const textTokens = usage.input_tokens_details.text_tokens || 0;
    const imageInputTokens = usage.input_tokens_details.image_tokens || 0;
    const imageOutputTokens = usage.output_tokens || 0;

    // Fórmula simplificada: 1 crédito por imagem gerada + tokens extras
    let credits = 1; // Custo base por imagem

    // Adicionar créditos extras para tokens complexos
    if (textTokens > 100) credits += 1;
    if (imageInputTokens > 0) credits += 1;
    if (imageOutputTokens > 0) credits += 1;

    return Math.min(credits, 5); // Máximo de 5 créditos por geração
}
