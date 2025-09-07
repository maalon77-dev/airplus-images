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

export async function POST(request: NextRequest) {
    let connection;
    
    try {
        const cookieStore = cookies();
        const sessionToken = cookieStore.get('session_token')?.value;

        if (!sessionToken) {
            return NextResponse.json({ 
                success: false, 
                error: 'Nenhuma sessão ativa encontrada' 
            }, { status: 400 });
        }

        // Conectar ao banco
        connection = await mysql.createConnection(dbConfig);

        // Buscar sessão
        const [sessions] = await connection.execute(
            'SELECT * FROM user_sessions WHERE session_token = ?',
            [sessionToken]
        );

        const sessionList = sessions as any[];
        if (sessionList.length === 0) {
            // Limpar cookie mesmo se sessão não existir
            cookieStore.delete('session_token');
            return NextResponse.json({ 
                success: true, 
                message: 'Logout realizado com sucesso' 
            });
        }

        const session = sessionList[0];

        // Log de atividade
        await connection.execute(
            'INSERT INTO user_activity_logs (user_id, activity_type, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [
                session.user_id,
                'logout',
                `Logout realizado com sucesso`,
                request.ip || request.headers.get('x-forwarded-for') || 'unknown',
                request.headers.get('user-agent') || 'unknown'
            ]
        );

        // Remover sessão do banco
        await connection.execute(
            'DELETE FROM user_sessions WHERE session_token = ?',
            [sessionToken]
        );

        // Limpar cookie
        cookieStore.delete('session_token');

        return NextResponse.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });

    } catch (error) {
        console.error('Erro no logout:', error);
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
