import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/mysql-db';
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

        // Testar conexão MySQL primeiro
        let isMySQLAvailable = false;
        try {
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
            isMySQLAvailable = true;
        } catch {
            console.log('⚠️ MySQL não disponível - usando dados mockados para login');
            isMySQLAvailable = false;
        }

        let user;
        
        if (!isMySQLAvailable) {
            // Dados mockados para desenvolvimento local
            const mockUsers = [
                { id: 4, username: 'admin2', password: 'admin123', user_level: 'ADMIN_SUPREMO' },
                { id: 15, username: 'jhully', password: 'teste123', user_level: 'USUARIO' },
                { id: 16, username: 'laura', password: 'teste123', user_level: 'USUARIO' }
            ];
            
            user = mockUsers.find(u => u.username === username);
            
            if (!user) {
                return NextResponse.json(
                    { error: 'Usuário não encontrado' },
                    { status: 401 }
                );
            }
            
            // Verificar senha mockada
            if (user.password !== password) {
                return NextResponse.json(
                    { error: 'Senha incorreta' },
                    { status: 401 }
                );
            }
        } else {
            // Buscar usuário no banco
            const connection = await pool.getConnection();
            try {
                const [rows] = await connection.execute(
                    'SELECT * FROM users WHERE username = ?',
                    [username]
                );
                const users = rows as Array<{ id: number; username: string; password_hash: string; user_level: string }>;
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
