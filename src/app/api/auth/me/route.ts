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
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // Buscar dados atualizados do usuário
        const user = await MySQLDatabase.getUserById(decoded.userId);
        
        if (!user) {
            return NextResponse.json(
                { error: 'Usuário não encontrado' },
                { status: 401 }
            );
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
