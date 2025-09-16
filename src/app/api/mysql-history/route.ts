import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET - Recuperar histórico do MySQL
async function handleGetHistory(request: NextRequest, user: { id: number; username: string; userLevel: string }) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        // Testar conexão MySQL primeiro
        const isMySQLAvailable = await MySQLDatabase.testConnection();
        
        if (!isMySQLAvailable) {
            console.log('⚠️ MySQL não disponível - retornando dados mockados para desenvolvimento');
            
            // Dados mockados para desenvolvimento local
            const mockHistory = user.userLevel === 'ADMIN_SUPREMO' ? [
                {
                    id: 1,
                    timestamp: Date.now() - 3600000,
                    prompt: "Imagem de teste do admin",
                    mode: "generate",
                    quality: "high",
                    background: "auto",
                    moderation: "auto",
                    output_format: "png",
                    size: "auto",
                    n_images: 1,
                    duration_ms: 5000,
                    cost_usd: 0.05,
                    cost_brl: 0.25,
                    text_input_tokens: 20,
                    image_input_tokens: 0,
                    image_output_tokens: 100,
                    user_id: user.id,
                    created_at: new Date(),
                    images: [{ filename: "mock-image-1.png" }],
                    user: {
                        id: user.id,
                        username: user.username,
                        user_level: user.userLevel
                    }
                },
                {
                    id: 2,
                    timestamp: Date.now() - 7200000,
                    prompt: "Outra imagem de teste",
                    mode: "edit",
                    quality: "medium",
                    background: "transparent",
                    moderation: "auto",
                    output_format: "png",
                    size: "auto",
                    n_images: 1,
                    duration_ms: 3000,
                    cost_usd: 0.03,
                    cost_brl: 0.15,
                    text_input_tokens: 15,
                    image_input_tokens: 50,
                    image_output_tokens: 80,
                    user_id: user.id,
                    created_at: new Date(),
                    images: [{ filename: "mock-image-2.png" }],
                    user: {
                        id: user.id,
                        username: user.username,
                        user_level: user.userLevel
                    }
                }
            ] : [
                {
                    id: 1,
                    timestamp: Date.now() - 3600000,
                    prompt: "Minha imagem de teste",
                    mode: "generate",
                    quality: "high",
                    background: "auto",
                    moderation: "auto",
                    output_format: "png",
                    size: "auto",
                    n_images: 1,
                    duration_ms: 5000,
                    cost_usd: 0.05,
                    cost_brl: 0.25,
                    text_input_tokens: 20,
                    image_input_tokens: 0,
                    image_output_tokens: 100,
                    user_id: user.id,
                    created_at: new Date(),
                    images: [{ filename: "mock-image-1.png" }]
                }
            ];

            return NextResponse.json({ 
                success: true, 
                history: mockHistory,
                mock: true // Indicar que são dados mockados
            });
        }

        // ADMIN_SUPREMO vê todo o histórico, USUARIO vê apenas o próprio
        const history = user.userLevel === 'ADMIN_SUPREMO' 
            ? await MySQLDatabase.getGenerationHistory(limit)
            : await MySQLDatabase.getGenerationHistoryByUser(user.id, limit);
        
        // Para cada item do histórico, buscar as imagens relacionadas e informações do usuário (se admin)
        const historyWithImages = await Promise.all(
            history.map(async (item) => {
                const images = await MySQLDatabase.getHistoryImages(item.id);
                const result = {
                    ...item,
                    images: images.map(img => ({ filename: img.filename }))
                };
                
                // Se for admin, incluir informações do usuário que criou o histórico
                if (user.userLevel === 'ADMIN_SUPREMO' && item.user_id) {
                    const userInfo = await MySQLDatabase.getUserById(item.user_id);
                    if (userInfo) {
                        result.user = {
                            id: userInfo.id,
                            username: userInfo.username,
                            user_level: userInfo.user_level
                        };
                    }
                }
                
                return result;
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

export const GET = requireAuth(handleGetHistory);

// POST - Salvar histórico no MySQL
async function handlePostHistory(request: NextRequest, user: { id: number; username: string; userLevel: string }) {
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
            image_output_tokens: image_output_tokens || 0,
            user_id: user.id
        }, user.id);

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

export const POST = requireAuth(handlePostHistory);

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
