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

async function fixAllAdminLevels() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Corrigir todos os níveis de admin para o formato correto
        console.log('🔧 Corrigindo níveis de usuário...');
        
        // Atualizar admin_supremo para ADMIN_SUPREMO
        await connection.execute(
            'UPDATE users SET user_level = ? WHERE user_level = ?',
            ['ADMIN_SUPREMO', 'admin_supremo']
        );
        console.log('✅ Níveis admin_supremo atualizados para ADMIN_SUPREMO');

        // Atualizar admin para ADMIN_SUPREMO (assumindo que é admin principal)
        await connection.execute(
            'UPDATE users SET user_level = ? WHERE username = ? AND user_level = ?',
            ['ADMIN_SUPREMO', 'admin', 'admin']
        );
        console.log('✅ Usuário admin atualizado para ADMIN_SUPREMO');

        // Atualizar usuario_normal para USUARIO
        await connection.execute(
            'UPDATE users SET user_level = ? WHERE user_level = ?',
            ['USUARIO', 'usuario_normal']
        );
        console.log('✅ Níveis usuario_normal atualizados para USUARIO');

        // Listar todos os usuários para verificar
        console.log('📋 Listando todos os usuários após correção:');
        const [users] = await connection.execute(
            'SELECT id, username, user_level, created_at FROM users ORDER BY created_at DESC'
        );
        
        users.forEach(user => {
            const levelIcon = user.user_level === 'ADMIN_SUPREMO' ? '👑' : '👤';
            console.log(`   ${levelIcon} ${user.id} | ${user.username} | ${user.user_level} | ${user.created_at}`);
        });

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexão fechada.');
        }
    }
}

fixAllAdminLevels();
