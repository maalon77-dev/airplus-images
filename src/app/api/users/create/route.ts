import { NextRequest, NextResponse } from 'next/server';
import { MySQLDatabase } from '@/lib/mysql-db';
import { requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleCreateUser(request: NextRequest, _user: { id: number; username: string; userLevel: string }) {
    try {
        const { username, password, userLevel } = await request.json();

        if (!username || !password || !userLevel) {
            return NextResponse.json(
                { error: 'Username, password e userLevel são obrigatórios' },
                { status: 400 }
            );
        }

        // Validar nível de usuário
        if (!['ADMIN_SUPREMO', 'USUARIO'].includes(userLevel)) {
            return NextResponse.json(
                { error: 'userLevel deve ser ADMIN_SUPREMO ou USUARIO' },
                { status: 400 }
            );
        }

        // Verificar se o usuário já existe
        const connection = await MySQLDatabase['pool'].getConnection();
        let existingUser;
        try {
            const [rows] = await connection.execute(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );
            const users = rows as Array<{ id: number }>;
            existingUser = users.length > 0 ? users[0] : null;
        } finally {
            connection.release();
        }

        if (existingUser) {
            return NextResponse.json(
                { error: 'Username já existe' },
                { status: 409 }
            );
        }

        // Gerar hash da senha
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Criar usuário
        const userId = await MySQLDatabase.createUser(username, passwordHash, userLevel as 'ADMIN_SUPREMO' | 'USUARIO');

        return NextResponse.json({
            success: true,
            message: 'Usuário criado com sucesso',
            user: {
                id: userId,
                username,
                userLevel
            }
        });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

export const POST = requireAdmin(handleCreateUser);
