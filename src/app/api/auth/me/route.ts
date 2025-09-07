import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
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

export async function GET(request: NextRequest) {
    let connection;
    
    try {
        const cookieStore = cookies();
        const sessionToken = cookieStore.get('session_token')?.value;

        if (!sessionToken) {
            return NextResponse.json({ 
                success: false, 
                error: 'Nenhuma sessão ativa' 
            }, { status: 401 });
        }

        // Conectar ao banco
        connection = await mysql.createConnection(dbConfig);

        // Buscar sessão válida
        const [sessions] = await connection.execute(
            `SELECT s.*, u.username, u.email, u.user_level, u.last_login 
             FROM user_sessions s 
             INNER JOIN users u ON s.user_id = u.id 
             WHERE s.session_token = ? AND s.expires_at > NOW() AND u.is_active = TRUE`,
            [sessionToken]
        );

        const sessionList = sessions as any[];
        if (sessionList.length === 0) {
            // Sessão expirada ou inválida
            cookieStore.delete('session_token');
            return NextResponse.json({ 
                success: false, 
                error: 'Sessão expirada ou inválida' 
            }, { status: 401 });
        }

        const session = sessionList[0];

        return NextResponse.json({
            success: true,
            user: {
                id: session.user_id,
                username: session.username,
                email: session.email,
                user_level: session.user_level,
                last_login: session.last_login
            },
            session: {
                expires_at: session.expires_at,
                created_at: session.created_at
            }
        });

    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
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
