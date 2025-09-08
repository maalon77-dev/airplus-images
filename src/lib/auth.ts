import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { MySQLDatabase } from './mysql-db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
    id: number;
    username: string;
    userLevel: 'ADMIN_SUPREMO' | 'USUARIO';
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
    try {
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return null;
        }

        // Verificar e decodificar token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string; userLevel: string };
        
        // Testar conexão MySQL primeiro
        let isMySQLAvailable = false;
        try {
            const { pool } = await import('./mysql-db');
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
            isMySQLAvailable = true;
        } catch {
            console.log('⚠️ MySQL não disponível - usando dados mockados para getAuthenticatedUser');
            isMySQLAvailable = false;
        }

        let user;
        
        if (!isMySQLAvailable) {
            // Dados mockados para desenvolvimento local
            const mockUsers = [
                { id: 4, username: 'admin2', user_level: 'ADMIN_SUPREMO' },
                { id: 15, username: 'jhully', user_level: 'USUARIO' },
                { id: 16, username: 'laura', user_level: 'USUARIO' }
            ];
            
            user = mockUsers.find(u => u.id === decoded.userId);
            
            if (!user) {
                return null;
            }
        } else {
            // Buscar dados atualizados do usuário
            user = await MySQLDatabase.getUserById(decoded.userId);
            
            if (!user) {
                return null;
            }
        }

        return {
            id: user.id,
            username: user.username,
            userLevel: user.user_level as 'ADMIN_SUPREMO' | 'USUARIO'
        };
    } catch (error) {
        console.error('Erro na verificação do token:', error);
        return null;
    }
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
    return async (request: NextRequest) => {
        const user = await getAuthenticatedUser(request);
        
        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Não autorizado' }),
                { 
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return handler(request, user);
    };
}

export function requireAdmin(handler: (request: NextRequest, user: AuthUser) => Promise<Response>) {
    return async (request: NextRequest) => {
        const user = await getAuthenticatedUser(request);
        
        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Não autorizado' }),
                { 
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        if (user.userLevel !== 'ADMIN_SUPREMO') {
            return new Response(
                JSON.stringify({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' }),
                { 
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return handler(request, user);
    };
}
