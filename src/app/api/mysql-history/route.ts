import { NextRequest, NextResponse } from 'next/server';
import MySQLDatabase from '@/lib/mysql-db';

// GET - Recuperar histórico do MySQL
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const history = await MySQLDatabase.getGenerationHistory(limit);
        
        // Para cada item do histórico, buscar as imagens relacionadas
        const historyWithImages = await Promise.all(
            history.map(async (item) => {
                const images = await MySQLDatabase.getHistoryImages(item.id);
                return {
                    ...item,
                    images: images.map(img => ({ filename: img.filename }))
                };
            })
        );

        return NextResponse.json({ 
            success: true, 
            history: historyWithImages 
        });
    } catch (error) {
        console.error('Erro ao recuperar histórico do MySQL:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// POST - Salvar histórico no MySQL
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            timestamp,
            prompt,
            mode,
            quality,
            background,
            moderation,
            output_format,
            size,
            n_images,
            duration_ms,
            cost_usd,
            cost_brl,
            text_input_tokens,
            image_input_tokens,
            image_output_tokens,
            image_filenames
        } = body;

        // Validar dados obrigatórios
        if (!timestamp || !prompt || !mode) {
            return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 });
        }

        // Salvar histórico
        const historyId = await MySQLDatabase.saveGenerationHistory({
            timestamp,
            prompt,
            mode,
            quality: quality || 'auto',
            background: background || 'auto',
            moderation: moderation || 'auto',
            output_format: output_format || 'png',
            size: size || 'auto',
            n_images: n_images || 1,
            duration_ms: duration_ms || 0,
            cost_usd: cost_usd || 0,
            cost_brl: cost_brl || 0,
            text_input_tokens: text_input_tokens || 0,
            image_input_tokens: image_input_tokens || 0,
            image_output_tokens: image_output_tokens || 0
        });

        // Relacionar imagens com o histórico
        if (image_filenames && Array.isArray(image_filenames)) {
            for (const filename of image_filenames) {
                // Buscar ID da imagem pelo filename
                const image = await MySQLDatabase.getImage(filename);
                if (image) {
                    await MySQLDatabase.linkImageToHistory(historyId, image.id);
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            historyId,
            message: 'Histórico salvo com sucesso no MySQL' 
        });
    } catch (error) {
        console.error('Erro ao salvar histórico no MySQL:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

// DELETE - Deletar item do histórico
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const historyId = searchParams.get('historyId');

        if (!historyId) {
            return NextResponse.json({ error: 'ID do histórico é obrigatório' }, { status: 400 });
        }

        await MySQLDatabase.deleteHistory(parseInt(historyId));

        return NextResponse.json({ 
            success: true, 
            message: 'Histórico deletado com sucesso' 
        });
    } catch (error) {
        console.error('Erro ao deletar histórico do MySQL:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
