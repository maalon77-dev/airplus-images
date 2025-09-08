const mysql = require('mysql2/promise');

// Configurações do banco
const config = {
    host: 'criargptimgs.mysql.dbaas.com.br',
    port: 3306,
    user: 'criargptimgs',
    password: 'vida1503A@',
    database: 'criargptimgs',
    ssl: { rejectUnauthorized: false }
};

async function fixOrphanImages() {
    const connection = await mysql.createConnection(config);
    
    try {
        console.log('🔧 Corrigindo imagens órfãs (sem histórico)...');
        
        // Buscar todas as imagens que não têm histórico associado
        const [orphanImages] = await connection.execute(`
            SELECT i.id, i.filename, i.user_id, i.created_at, u.username
            FROM images i 
            LEFT JOIN history_images hi ON i.id = hi.image_id 
            LEFT JOIN users u ON i.user_id = u.id
            WHERE hi.image_id IS NULL
            ORDER BY i.created_at DESC
        `);
        
        console.log(`📸 Encontradas ${orphanImages.length} imagens órfãs`);
        
        for (const image of orphanImages) {
            console.log(`\n🔄 Processando imagem: ${image.filename} (User: ${image.username || 'null'})`);
            
            // Criar registro de histórico para a imagem
            const historyData = {
                timestamp: new Date(image.created_at).getTime(),
                prompt: `Imagem gerada automaticamente - ${image.filename}`,
                mode: 'generate',
                quality: 'auto',
                background: 'auto',
                moderation: 'auto',
                output_format: image.filename.split('.').pop() || 'png',
                size: 'auto',
                n_images: 1,
                duration_ms: 0,
                cost_usd: 0,
                cost_brl: 0,
                text_input_tokens: 0,
                image_input_tokens: 0,
                image_output_tokens: 0,
                user_id: image.user_id
            };
            
            // Inserir histórico
            const [historyResult] = await connection.execute(
                `INSERT INTO generation_history 
                (timestamp, prompt, mode, quality, background, moderation, output_format, size, n_images, 
                 duration_ms, cost_usd, cost_brl, text_input_tokens, image_input_tokens, image_output_tokens, user_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    historyData.timestamp, historyData.prompt, historyData.mode, historyData.quality, 
                    historyData.background, historyData.moderation, historyData.output_format, 
                    historyData.size, historyData.n_images, historyData.duration_ms, 
                    historyData.cost_usd, historyData.cost_brl, historyData.text_input_tokens, 
                    historyData.image_input_tokens, historyData.image_output_tokens, historyData.user_id
                ]
            );
            
            const historyId = historyResult.insertId;
            console.log(`  ✅ Histórico criado com ID: ${historyId}`);
            
            // Relacionar imagem com o histórico
            await connection.execute(
                'INSERT INTO history_images (history_id, image_id) VALUES (?, ?)',
                [historyId, image.id]
            );
            
            console.log(`  ✅ Imagem ${image.id} relacionada ao histórico ${historyId}`);
        }
        
        console.log('\n🎉 Correção concluída com sucesso!');
        
        // Verificar se ainda há imagens órfãs
        const [remainingOrphans] = await connection.execute(`
            SELECT COUNT(*) as count
            FROM images i 
            LEFT JOIN history_images hi ON i.id = hi.image_id 
            WHERE hi.image_id IS NULL
        `);
        
        console.log(`\n📊 Imagens órfãs restantes: ${remainingOrphans[0].count}`);
        
    } catch (error) {
        console.error('❌ Erro ao corrigir imagens órfãs:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    fixOrphanImages();
}

module.exports = { fixOrphanImages };
