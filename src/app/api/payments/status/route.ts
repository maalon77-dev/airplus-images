import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import MySQLDatabase from '@/lib/mysql-db';

// GET /api/payments/status - Verificar status de pagamentos do usuário
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const payment_intent_id = searchParams.get('payment_intent_id');

        const db = new MySQLDatabase();
        await db.connect();

        if (payment_intent_id) {
            // Buscar pagamento específico
            const [payments] = await db.connection.execute(`
                SELECT 
                    p.id,
                    p.stripe_payment_intent_id,
                    p.amount_usd,
                    p.amount_brl,
                    p.currency,
                    p.status,
                    p.credits_granted,
                    p.created_at,
                    pp.name as plan_name
                FROM payments p
                JOIN payment_plans pp ON p.plan_id = pp.id
                WHERE p.user_id = ? AND p.stripe_payment_intent_id = ?
            `, [user.id, payment_intent_id]);

            await db.disconnect();

            if (!Array.isArray(payments) || payments.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Pagamento não encontrado' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                payment: payments[0]
            });

        } else {
            // Buscar todos os pagamentos do usuário
            const [payments] = await db.connection.execute(`
                SELECT 
                    p.id,
                    p.stripe_payment_intent_id,
                    p.amount_usd,
                    p.amount_brl,
                    p.currency,
                    p.status,
                    p.credits_granted,
                    p.created_at,
                    pp.name as plan_name
                FROM payments p
                JOIN payment_plans pp ON p.plan_id = pp.id
                WHERE p.user_id = ?
                ORDER BY p.created_at DESC
                LIMIT 20
            `, [user.id]);

            // Buscar saldo de créditos do usuário
            const [credits] = await db.connection.execute(`
                SELECT 
                    credits_balance,
                    total_credits_earned,
                    total_credits_used
                FROM user_credits
                WHERE user_id = ?
            `, [user.id]);

            await db.disconnect();

            const userCredits = Array.isArray(credits) && credits.length > 0 
                ? credits[0] 
                : { credits_balance: 0, total_credits_earned: 0, total_credits_used: 0 };

            return NextResponse.json({
                success: true,
                payments: payments,
                credits: userCredits
            });
        }

    } catch (error) {
        console.error('Erro ao buscar status de pagamentos:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
