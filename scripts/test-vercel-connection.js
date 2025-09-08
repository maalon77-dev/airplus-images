const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configurações do banco (mesmas do Vercel)
const config = {
    host: 'criargptimgs.mysql.dbaas.com.br',
    port: 3306,
    user: 'criargptimgs',
    password: 'vida1503A@',
    database: 'criargptimgs',
    ssl: { rejectUnauthorized: false }
};

async function testVercelConnection() {
    const connection = await mysql.createConnection(config);
    
    try {
        console.log('🔍 Testando conexão com banco de dados...');
        
        // Testar conexão
        await connection.execute('SELECT 1');
        console.log('✅ Conexão com banco estabelecida');
        
        // Verificar usuário ID 14
        const [users] = await connection.execute('SELECT * FROM users WHERE id = 14');
        if (users.length === 0) {
            console.log('❌ Usuário ID 14 não encontrado');
            return;
        }
        
        const user = users[0];
        console.log('✅ Usuário ID 14 encontrado:', {
            id: user.id,
            username: user.username,
            user_level: user.user_level,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at
        });
        
        // Testar senha
        const isValidPassword = await bcrypt.compare('teste123', user.password_hash);
        console.log('🔐 Senha teste123 válida:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('🔧 Corrigindo senha...');
            const newPasswordHash = await bcrypt.hash('teste123', 10);
            await connection.execute(
                'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = 14',
                [newPasswordHash]
            );
            console.log('✅ Senha corrigida');
        }
        
        // Verificar se há imagens do usuário
        const [images] = await connection.execute('SELECT COUNT(*) as count FROM images WHERE user_id = 14');
        console.log('📸 Imagens do usuário:', images[0].count);
        
        // Verificar histórico do usuário
        const [history] = await connection.execute('SELECT COUNT(*) as count FROM generation_history WHERE user_id = 14');
        console.log('📋 Histórico do usuário:', history[0].count);
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error.message);
    } finally {
        await connection.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testVercelConnection();
}

module.exports = { testVercelConnection };
