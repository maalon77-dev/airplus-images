import { NextRequest, NextResponse } from 'next/server';
import { createFTPUploadService } from '@/lib/ftp-upload';
import { requireAuth } from '@/lib/auth';

async function handleFTPUpload(request: NextRequest, _user: { id: number; username: string; userLevel: string }) {
    try {
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

export const POST = requireAuth(handleFTPUpload);

async function handleFTPDelete(request: NextRequest, _user: { id: number; username: string; userLevel: string }) {
    try {
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

export const DELETE = requireAuth(handleFTPDelete);
