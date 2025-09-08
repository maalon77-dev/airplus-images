import { NextResponse } from 'next/server';
import { createFTPUploadService } from '@/lib/ftp-upload';

export async function GET() {
    try {
        const ftpService = createFTPUploadService();
        
        if (!ftpService) {
            return NextResponse.json({
                success: false,
                error: 'Configurações FTP não encontradas'
            }, { status: 400 });
        }

        const isConnected = await ftpService.testConnection();
        
        return NextResponse.json({
            success: isConnected,
            message: isConnected ? 'Conexão FTP funcionando' : 'Falha na conexão FTP'
        });

    } catch (error) {
        console.error('Erro ao testar FTP:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor'
        }, { status: 500 });
    }
}
