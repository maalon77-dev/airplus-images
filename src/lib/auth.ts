import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { MySQLDatabase, User } from './mysql-db';

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
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // Buscar dados atualizados do usuário
        const user = await MySQLDatabase.getUserById(decoded.userId);
        
        if (!user) {
            return null;
        }

        return {
            id: user.id,
            username: user.username,
            userLevel: user.user_level
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
