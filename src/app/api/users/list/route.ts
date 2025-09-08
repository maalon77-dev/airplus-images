import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { pool } from '@/lib/mysql-db';

async function handleListUsers(_request: NextRequest, _user: { id: number; username: string; userLevel: string }) {
    try {
        const connection = await pool.getConnection();
        let users;
        try {
            const [rows] = await connection.execute(
                'SELECT id, username, user_level, created_at FROM users ORDER BY created_at DESC'
            );
            users = rows as Array<{ id: number; username: string; user_level: string; created_at: Date }>;
        } finally {
            connection.release();
        }

        return NextResponse.json({
            success: true,
            users: users.map(u => ({
                id: u.id,
                username: u.username,
                userLevel: u.user_level,
                createdAt: u.created_at
            }))
        });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export const GET = requireAdmin(handleListUsers);
