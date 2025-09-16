import { NextResponse } from 'next/server';

// GET - Testar conexão com MySQL
export async function GET() {
    try {
        const isConnected = await MySQLDatabase.testConnection();
        
        if (isConnected) {
            return NextResponse.json({ 
                success: true, 
                message: 'Conexão com MySQL estabelecida com sucesso',
                timestamp: new Date().toISOString()
            });
        } else {
            return NextResponse.json({ 
                success: false, 
                message: 'Falha na conexão com MySQL' 
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Erro ao testar conexão MySQL:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Erro interno do servidor',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
    }
}
