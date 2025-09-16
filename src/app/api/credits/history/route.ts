import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import MySQLDatabase from '@/lib/mysql-db';

// GET /api/credits/history - Obter histórico de transações de créditos
export async function GET(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const db = new MySQLDatabase();
        await db.connect();

        // Buscar histórico de transações
        const [transactions] = await db.connection.execute(`
            SELECT 
                ct.id,
                ct.transaction_type,
                ct.amount,
                ct.description,
                ct.created_at,
                p.amount_usd,
                p.amount_brl,
                p.currency,
                pp.name as plan_name
            FROM credit_transactions ct
            LEFT JOIN payments p ON ct.related_payment_id = p.id
            LEFT JOIN payment_plans pp ON p.plan_id = pp.id
            WHERE ct.user_id = ?
            ORDER BY ct.created_at DESC
            LIMIT ? OFFSET ?
        `, [user.id, limit, offset]);

        // Contar total de transações
        const [countResult] = await db.connection.execute(`
            SELECT COUNT(*) as total FROM credit_transactions WHERE user_id = ?
        `, [user.id]);

        await db.disconnect();

        const total = Array.isArray(countResult) && countResult.length > 0 
            ? (countResult[0] as { total: number }).total 
            : 0;

        return NextResponse.json({
            success: true,
            transactions: transactions,
            pagination: {
                total,
                limit,
                offset,
                has_more: offset + limit < total
            }
        });

    } catch (error) {
        console.error('Erro ao buscar histórico de créditos:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
