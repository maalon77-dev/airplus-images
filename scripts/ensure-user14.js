const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configurações do banco
const config = {
    host: 'criargptimgs.mysql.dbaas.com.br',
    port: 3306,
    user: 'criargptimgs',
    password: 'vida1503A@',
    database: 'criargptimgs',
    ssl: { rejectUnauthorized: false }
};

async function ensureUser14() {
    const connection = await mysql.createConnection(config);
    
    try {
        console.log('🔧 Verificando e garantindo usuário ID 14 (jhully)...');
        
        // Verificar se o usuário existe
        const [users] = await connection.execute('SELECT * FROM users WHERE id = 14');
        
        if (users.length === 0) {
            console.log('❌ Usuário ID 14 não encontrado. Criando...');
            
            // Criar o usuário
            const passwordHash = await bcrypt.hash('teste123', 10);
            await connection.execute(
                'INSERT INTO users (id, username, email, password_hash, user_level, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
                [14, 'jhully', 'jhully@localhost', passwordHash, 'USUARIO', 1]
            );
            
            console.log('✅ Usuário ID 14 criado com sucesso');
        } else {
            console.log('✅ Usuário ID 14 já existe');
            
            // Verificar se a senha está correta
            const user = users[0];
            const isValidPassword = await bcrypt.compare('teste123', user.password_hash);
            
            if (!isValidPassword) {
                console.log('🔐 Senha incorreta. Atualizando senha...');
                const newPasswordHash = await bcrypt.hash('teste123', 10);
                await connection.execute(
                    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = 14',
                    [newPasswordHash]
                );
                console.log('✅ Senha atualizada com sucesso');
            } else {
                console.log('🔐 Senha está correta');
            }
            
            // Verificar se o usuário está ativo
            if (!user.is_active) {
                console.log('🔄 Usuário inativo. Ativando...');
                await connection.execute(
                    'UPDATE users SET is_active = 1, updated_at = NOW() WHERE id = 14'
                );
                console.log('✅ Usuário ativado');
            }
        }
        
        // Verificar se há imagens órfãs do usuário
        const [orphanImages] = await connection.execute(`
            SELECT i.id, i.filename, i.created_at
            FROM images i 
            LEFT JOIN history_images hi ON i.id = hi.image_id 
            WHERE i.user_id = 14 AND hi.image_id IS NULL
            ORDER BY i.created_at DESC
        `);
        
        if (orphanImages.length > 0) {
            console.log(`🔍 Encontradas ${orphanImages.length} imagens órfãs do usuário 14. Corrigindo...`);
            
            for (const image of orphanImages) {
                // Criar histórico para a imagem
                const [historyResult] = await connection.execute(
                    `INSERT INTO generation_history 
                    (timestamp, prompt, mode, quality, background, moderation, output_format, size, n_images, 
                     duration_ms, cost_usd, cost_brl, text_input_tokens, image_input_tokens, image_output_tokens, user_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        new Date(image.created_at).getTime(),
                        `Imagem gerada automaticamente - ${image.filename}`,
                        'generate', 'auto', 'auto', 'auto', 
                        image.filename.split('.').pop() || 'png',
                        'auto', 1, 0, 0, 0, 0, 0, 0, 14
                    ]
                );
                
                const historyId = historyResult.insertId;
                
                // Relacionar imagem com histórico
                await connection.execute(
                    'INSERT INTO history_images (history_id, image_id) VALUES (?, ?)',
                    [historyId, image.id]
                );
                
                console.log(`  ✅ Imagem ${image.filename} corrigida`);
            }
        }
        
        console.log('🎉 Verificação e correção do usuário ID 14 concluída!');
        
    } catch (error) {
        console.error('❌ Erro ao verificar/corrigir usuário ID 14:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    ensureUser14();
}

module.exports = { ensureUser14 };
