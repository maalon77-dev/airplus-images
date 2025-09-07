import { NextRequest } from 'next/server';
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

export interface AuthenticatedUser {
    id: number;
    username: string;
    email: string;
    user_level: string;
    last_login: string;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
    try {
        const cookieStore = cookies();
        const sessionToken = cookieStore.get('session_token')?.value;

        if (!sessionToken) {
            return null;
        }

        // Conectar ao banco
        const connection = await mysql.createConnection(dbConfig);

        // Buscar sessão válida
        const [sessions] = await connection.execute(
            `SELECT s.*, u.username, u.email, u.user_level, u.last_login 
             FROM user_sessions s 
             INNER JOIN users u ON s.user_id = u.id 
             WHERE s.session_token = ? AND s.expires_at > NOW() AND u.is_active = TRUE`,
            [sessionToken]
        );

        await connection.end();

        const sessionList = sessions as any[];
        if (sessionList.length === 0) {
            return null;
        }

        const session = sessionList[0];
        return {
            id: session.user_id,
            username: session.username,
            email: session.email,
            user_level: session.user_level,
            last_login: session.last_login
        };

    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return null;
    }
}

export function requireAuth(requiredLevel?: 'admin_supremo' | 'admin' | 'usuario_normal') {
    return async function authMiddleware(request: NextRequest) {
        const user = await getAuthenticatedUser(request);
        
        if (!user) {
            return {
                success: false,
                error: 'Não autenticado',
                status: 401
            };
        }

        if (requiredLevel) {
            const levelHierarchy = {
                'usuario_normal': 1,
                'admin': 2,
                'admin_supremo': 3
            };

            const userLevel = levelHierarchy[user.user_level as keyof typeof levelHierarchy] || 0;
            const requiredLevelValue = levelHierarchy[requiredLevel];

            if (userLevel < requiredLevelValue) {
                return {
                    success: false,
                    error: 'Permissão insuficiente',
                    status: 403
                };
            }
        }

        return {
            success: true,
            user
        };
    };
}
