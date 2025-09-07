import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { requireAuth } from '@/lib/auth-middleware';

// Configurações do banco
const dbConfig = {
    host: 'criargptimgs.mysql.dbaas.com.br',
    port: 3306,
    user: 'criargptimgs',
    password: 'vida1503A@',
    database: 'criargptimgs',
    ssl: { rejectUnauthorized: false }
};

// GET - Listar usuários (apenas admins)
export async function GET(request: NextRequest) {
    const authResult = await requireAuth('admin')(request);
    if (!authResult.success) {
        return NextResponse.json({ 
            success: false, 
            error: authResult.error 
        }, { status: authResult.status });
    }

    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);

        const [users] = await connection.execute(
            `SELECT id, username, email, user_level, is_active, last_login, created_at 
             FROM users 
             ORDER BY created_at DESC`
        );

        return NextResponse.json({
            success: true,
            users
        });

    } catch (error) {
        console.error('Erro ao listar usuários:', error);
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

// POST - Criar usuário (apenas admins)
export async function POST(request: NextRequest) {
    const authResult = await requireAuth('admin')(request);
    if (!authResult.success) {
        return NextResponse.json({ 
            success: false, 
            error: authResult.error 
        }, { status: authResult.status });
    }

    let connection;
    
    try {
        const { username, email, password, user_level } = await request.json();

        if (!username || !email || !password || !user_level) {
            return NextResponse.json({ 
                success: false, 
                error: 'Todos os campos são obrigatórios' 
            }, { status: 400 });
        }

        // Validar nível de usuário
        if (!['admin_supremo', 'admin', 'usuario_normal'].includes(user_level)) {
            return NextResponse.json({ 
                success: false, 
                error: 'Nível de usuário inválido' 
            }, { status: 400 });
        }

        // Verificar se o usuário atual pode criar este nível
        const currentUser = authResult.user;
        if (user_level === 'admin_supremo' && currentUser.user_level !== 'admin_supremo') {
            return NextResponse.json({ 
                success: false, 
                error: 'Apenas admin supremo pode criar outros admin supremos' 
            }, { status: 403 });
        }

        connection = await mysql.createConnection(dbConfig);

        // Verificar se usuário já existe
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if ((existingUsers as any[]).length > 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Usuário ou email já existe' 
            }, { status: 400 });
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);

        // Criar usuário
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password_hash, user_level) VALUES (?, ?, ?, ?)',
            [username, email, passwordHash, user_level]
        );

        const insertResult = result as any;
        const userId = insertResult.insertId;

        // Log de atividade
        await connection.execute(
            'INSERT INTO user_activity_logs (user_id, activity_type, description, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [
                currentUser.id,
                'user_created',
                `Usuário criado: ${username} (${user_level})`,
                request.ip || request.headers.get('x-forwarded-for') || 'unknown',
                request.headers.get('user-agent') || 'unknown'
            ]
        );

        return NextResponse.json({
            success: true,
            message: 'Usuário criado com sucesso',
            user: {
                id: userId,
                username,
                email,
                user_level
            }
        });

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
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
