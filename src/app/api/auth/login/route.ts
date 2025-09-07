import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';

// Configurações do banco
const dbConfig = {
    host: 'criargptimgs.mysql.dbaas.com.br',
    port: 3306,
    user: 'criargptimgs',
    password: 'vida1503A@',
    database: 'criargptimgs',
    ssl: { rejectUnauthorized: false }
};

export async function POST(request: NextRequest) {
    let connection;
    
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ 
                success: false, 
                error: 'Usuário e senha são obrigatórios' 
            }, { status: 400 });
        }

        // Conectar ao banco
        connection = await mysql.createConnection(dbConfig);

        // Buscar usuário
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
            [username]
        );

        const userList = users as any[];
        if (userList.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Usuário não encontrado ou inativo' 
            }, { status: 401 });
        }

        const user = userList[0];

        // Verificar senha
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return NextResponse.json({ 
                success: false, 
                error: 'Senha incorreta' 
            }, { status: 401 });
        }

        // Gerar token de sessão
        const sessionToken = generateSessionToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas

        // Salvar sessão no banco
        await connection.execute(
            'INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [
                user.id,
                sessionToken,
                expiresAt,
                request.ip || request.headers.get('x-forwarded-for') || 'unknown',
                request.headers.get('user-agent') || 'unknown'
            ]
        );

        // Atualizar último login
        await connection.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        // Log de atividade
        await connection.execute(
            'INSERT INTO user_activity_logs (user_id, activity_type, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [
                user.id,
                'login',
                `Login realizado com sucesso`,
                request.ip || request.headers.get('x-forwarded-for') || 'unknown',
                request.headers.get('user-agent') || 'unknown'
            ]
        );

        // Configurar cookie
        const cookieStore = cookies();
        cookieStore.set('session_token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24 horas
            path: '/'
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                user_level: user.user_level,
                last_login: user.last_login
            },
            message: 'Login realizado com sucesso'
        });

    } catch (error) {
        console.error('Erro no login:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Erro interno do servidor' 
        }, { status: 500 });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

function generateSessionToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
