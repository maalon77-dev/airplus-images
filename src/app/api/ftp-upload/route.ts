import { NextRequest, NextResponse } from 'next/server';
import { createFTPUploadService } from '@/lib/ftp-upload';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Verificar autenticação
        const authResult = await requireAuth(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { imageBuffer, filename } = await request.json();
        
        if (!imageBuffer || !filename) {
            return NextResponse.json({
                success: false,
                error: 'Dados de imagem não fornecidos'
            }, { status: 400 });
        }

        const ftpService = createFTPUploadService();
        
        if (!ftpService) {
            return NextResponse.json({
                success: false,
                error: 'Serviço FTP não configurado'
            }, { status: 500 });
        }

        // Converter base64 para buffer
        const buffer = Buffer.from(imageBuffer, 'base64');
        
        // Fazer upload para FTP
        const publicUrl = await ftpService.uploadImage(buffer, filename);
        
        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: filename
        });

    } catch (error) {
        console.error('Erro no upload FTP:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro no upload FTP'
        }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Verificar autenticação
        const authResult = await requireAuth(request);
        if (!authResult.success) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const { filename } = await request.json();
        
        if (!filename) {
            return NextResponse.json({
                success: false,
                error: 'Nome do arquivo não fornecido'
            }, { status: 400 });
        }

        const ftpService = createFTPUploadService();
        
        if (!ftpService) {
            return NextResponse.json({
                success: false,
                error: 'Serviço FTP não configurado'
            }, { status: 500 });
        }

        // Deletar do FTP
        const deleted = await ftpService.deleteImage(filename);
        
        return NextResponse.json({
            success: deleted,
            message: deleted ? 'Imagem deletada com sucesso' : 'Falha ao deletar imagem'
        });

    } catch (error) {
        console.error('Erro ao deletar do FTP:', error);
        return NextResponse.json({
            success: false,
            error: 'Erro ao deletar do FTP'
        }, { status: 500 });
    }
}
