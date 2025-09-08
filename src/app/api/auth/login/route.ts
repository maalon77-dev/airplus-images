import { NextRequest, NextResponse } from 'next/server';
import { MySQLDatabase, pool } from '@/lib/mysql-db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username e password são obrigatórios' },
                { status: 400 }
            );
        }

        // Buscar usuário no banco
        const connection = await pool.getConnection();
        let user;
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );
            const users = rows as any[];
            user = users.length > 0 ? users[0] : null;
        } finally {
            connection.release();
        }

        if (!user) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 401 }
            );
        }

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: 'Senha incorreta' },
                { status: 401 }
            );
        }

        // Gerar JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                userLevel: user.user_level 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Criar resposta com cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                userLevel: user.user_level
            }
        });

        // Definir cookie HTTP-only
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 // 24 horas
        });

        return response;
    } catch (error) {
        console.error('Erro no login:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
