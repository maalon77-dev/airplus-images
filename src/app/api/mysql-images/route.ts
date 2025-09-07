import { NextRequest, NextResponse } from 'next/server';
import MySQLDatabase from '@/lib/mysql-db';

// GET - Recuperar imagem do MySQL
export async function GET(request: NextRequest) {
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

// POST - Salvar imagem no MySQL
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;
        const filename = formData.get('filename') as string;

        if (!file || !filename) {
            return NextResponse.json({ error: 'Arquivo e filename são obrigatórios' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const imageId = await MySQLDatabase.saveImage(filename, buffer, file.type);

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

// DELETE - Deletar imagem do MySQL
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json({ error: 'Filename é obrigatório' }, { status: 400 });
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
