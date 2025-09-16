import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool } from '@/lib/mysql-db';

// GET /api/credits/balance - Obter saldo de créditos do usuário
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser(request);
        
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Não autorizado' },
                { status: 401 }
            );
        }
        
        const connection = await pool.getConnection();

        // Buscar saldo de créditos do usuário
        const [credits] = await connection.execute(`
            SELECT 
                credits_balance,
                total_credits_earned,
                total_credits_used,
                last_updated
            FROM user_credits
            WHERE user_id = ?
        `, [user.id]);

        connection.release();

        if (!Array.isArray(credits) || credits.length === 0) {
            // Usuário não tem registro de créditos, criar com saldo zero
            return NextResponse.json({
                success: true,
                credits: {
                    credits_balance: 0,
                    total_credits_earned: 0,
                    total_credits_used: 0,
                    last_updated: new Date().toISOString()
                }
            });
        }

        return NextResponse.json({
            success: true,
            credits: credits[0]
        });

    } catch (error) {
        console.error('Erro ao buscar saldo de créditos:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
