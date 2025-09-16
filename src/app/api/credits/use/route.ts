import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { pool } from '@/lib/mysql-db';

// POST /api/credits/use - Usar créditos para geração de imagem
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
        const { credits_to_use, description, generation_id } = body;

        if (!credits_to_use || credits_to_use <= 0) {
            return NextResponse.json(
                { success: false, error: 'Número de créditos inválido' },
                { status: 400 }
            );
        }

        const connection = await pool.getConnection();

        // Verificar saldo atual
        const [currentCredits] = await connection.execute(`
            SELECT credits_balance FROM user_credits WHERE user_id = ?
        `, [user.id]);

        let currentBalance = 0;
        if (Array.isArray(currentCredits) && currentCredits.length > 0) {
            currentBalance = (currentCredits[0] as { credits_balance: number }).credits_balance;
        }

        if (currentBalance < credits_to_use) {
            connection.release();
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Créditos insuficientes',
                    current_balance: currentBalance,
                    required: credits_to_use
                },
                { status: 400 }
            );
        }

        // Usar créditos
        const newBalance = currentBalance - credits_to_use;

        if (Array.isArray(currentCredits) && currentCredits.length > 0) {
            // Atualizar créditos existentes
            await connection.execute(`
                UPDATE user_credits 
                SET 
                    credits_balance = ?,
                    total_credits_used = total_credits_used + ?
                WHERE user_id = ?
            `, [newBalance, credits_to_use, user.id]);
        } else {
            // Criar novo registro (não deveria acontecer, mas por segurança)
            await connection.execute(`
                INSERT INTO user_credits (user_id, credits_balance, total_credits_used)
                VALUES (?, ?, ?)
            `, [user.id, newBalance, credits_to_use]);
        }

        // Registrar transação de uso
        await connection.execute(`
            INSERT INTO credit_transactions 
            (user_id, transaction_type, amount, description, related_generation_id)
            VALUES (?, 'used', ?, ?, ?)
        `, [user.id, credits_to_use, description || 'Uso de créditos para geração de imagem', generation_id]);

        connection.release();

        return NextResponse.json({
            success: true,
            new_balance: newBalance,
            credits_used: credits_to_use
        });

    } catch (error) {
        console.error('Erro ao usar créditos:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
