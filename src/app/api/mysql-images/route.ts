import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET - Recuperar imagem do MySQL
async function handleGetImage(request: NextRequest, user: { id: number; username: string; userLevel: string }) {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json({ error: 'Filename é obrigatório' }, { status: 400 });
        }

        const image = await MySQLDatabase.getImage(filename);
        
        if (!image) {
            return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 });
        }

        // Verificar se o usuário tem acesso à imagem
        // ADMIN_SUPREMO pode ver todas as imagens, USUARIO apenas as próprias
        if (user.userLevel !== 'ADMIN_SUPREMO' && image.user_id !== user.id) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        return new NextResponse(image.image_data, {
            headers: {
                'Content-Type': image.mime_type,
                'Content-Length': image.file_size.toString(),
                'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
            },
        });
    } catch (error) {
        console.error('Erro ao recuperar imagem do MySQL:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export const GET = requireAuth(handleGetImage);

// POST - Salvar imagem no MySQL
async function handlePostImage(request: NextRequest, user: { id: number; username: string; userLevel: string }) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;
        const filename = formData.get('filename') as string;

        if (!file || !filename) {
            return NextResponse.json({ error: 'Arquivo e filename são obrigatórios' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const imageId = await MySQLDatabase.saveImage(filename, buffer, file.type, user.id);

        return NextResponse.json({ 
            success: true, 
            imageId,
            message: 'Imagem salva com sucesso no MySQL' 
        });
    } catch (error) {
        console.error('Erro ao salvar imagem no MySQL:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export const POST = requireAuth(handlePostImage);

// DELETE - Deletar imagem do MySQL
async function handleDeleteImage(request: NextRequest, user: { id: number; username: string; userLevel: string }) {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json({ error: 'Filename é obrigatório' }, { status: 400 });
        }

        // Verificar se o usuário tem acesso à imagem antes de deletar
        const image = await MySQLDatabase.getImage(filename);
        if (image && user.userLevel !== 'ADMIN_SUPREMO' && image.user_id !== user.id) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        await MySQLDatabase.deleteImage(filename);

        return NextResponse.json({ 
            success: true, 
            message: 'Imagem deletada com sucesso' 
        });
    } catch (error) {
        console.error('Erro ao deletar imagem do MySQL:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export const DELETE = requireAuth(handleDeleteImage);
