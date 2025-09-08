import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { pool } from '@/lib/mysql-db';

async function handleDeleteUser(request: NextRequest, user: { id: number; username: string; userLevel: string }) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'ID do usuário é obrigatório' },
                { status: 400 }
            );
        }

        // Não permitir deletar a si mesmo
        if (userId === user.id) {
            return NextResponse.json(
                { error: 'Não é possível deletar seu próprio usuário' },
                { status: 400 }
            );
        }

        const connection = await pool.getConnection();
        try {
            // Verificar se o usuário existe
            const [rows] = await connection.execute(
                'SELECT id FROM users WHERE id = ?',
                [userId]
            );
            const users = rows as Array<{ id: number }>;
            
            if (users.length === 0) {
                return NextResponse.json(
                    { error: 'Usuário não encontrado' },
                    { status: 404 }
                );
            }

            // Deletar usuário (as imagens e histórico serão mantidos com user_id = null devido ao ON DELETE SET NULL)
            await connection.execute(
                'DELETE FROM users WHERE id = ?',
                [userId]
            );

            return NextResponse.json({
                success: true,
                message: 'Usuário deletado com sucesso'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export const DELETE = requireAdmin(handleDeleteUser);
