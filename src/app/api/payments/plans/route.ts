import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import MySQLDatabase from '@/lib/mysql-db';

// GET /api/payments/plans - Listar planos de pagamento disponíveis
export async function GET() {
    try {
        const db = new MySQLDatabase();
        await db.connect();

        const [plans] = await db.connection.execute(`
            SELECT 
                id,
                name,
                description,
                price_usd,
                price_brl,
                credits_included,
                is_active
            FROM payment_plans 
            WHERE is_active = true 
            ORDER BY price_usd ASC
        `);

        await db.disconnect();

        return NextResponse.json({
            success: true,
            plans: plans
        });

    } catch (error) {
        console.error('Erro ao buscar planos de pagamento:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// POST /api/payments/plans - Criar novo plano (apenas ADMIN_SUPREMO)
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        
        if (user.userLevel !== 'ADMIN_SUPREMO') {
            return NextResponse.json(
                { success: false, error: 'Acesso negado' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, description, price_usd, price_brl, credits_included, stripe_price_id_usd, stripe_price_id_brl } = body;

        if (!name || !price_usd || !price_brl || !credits_included) {
            return NextResponse.json(
                { success: false, error: 'Campos obrigatórios: name, price_usd, price_brl, credits_included' },
                { status: 400 }
            );
        }

        const db = new MySQLDatabase();
        await db.connect();

        const [result] = await db.connection.execute(`
            INSERT INTO payment_plans 
            (name, description, price_usd, price_brl, credits_included, stripe_price_id_usd, stripe_price_id_brl)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, description, price_usd, price_brl, credits_included, stripe_price_id_usd, stripe_price_id_brl]);

        await db.disconnect();

        return NextResponse.json({
            success: true,
            plan_id: (result as { insertId: number }).insertId,
            message: 'Plano criado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao criar plano de pagamento:', error);
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
