import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { MySQLDatabase } from '@/lib/mysql-db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Token não encontrado' },
                { status: 401 }
            );
        }

        // Verificar e decodificar token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string; userLevel: string };
        
        // Testar conexão MySQL primeiro
        let isMySQLAvailable = false;
        try {
            const { pool } = await import('@/lib/mysql-db');
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
            isMySQLAvailable = true;
        } catch {
            console.log('⚠️ MySQL não disponível - usando dados mockados para /api/auth/me');
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
                return NextResponse.json(
                    { error: 'Usuário não encontrado' },
                    { status: 401 }
                );
            }
        } else {
            // Buscar dados atualizados do usuário
            user = await MySQLDatabase.getUserById(decoded.userId);
            
            if (!user) {
                return NextResponse.json(
                    { error: 'Usuário não encontrado' },
                    { status: 401 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                userLevel: user.user_level
            }
        });
    } catch (error) {
        console.error('Erro na verificação do token:', error);
        return NextResponse.json(
            { error: 'Token inválido' },
            { status: 401 }
        );
    }
}
