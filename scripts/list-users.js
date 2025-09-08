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

async function listUsers() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Listar todos os usuários
        console.log('📋 Listando todos os usuários:');
        const [users] = await connection.execute(
            'SELECT id, username, email, user_level, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        
        users.forEach(user => {
            const levelIcon = user.user_level === 'ADMIN_SUPREMO' ? '👑' : '👤';
            const statusIcon = user.is_active ? '✅' : '❌';
            console.log(`   ${levelIcon} ${statusIcon} ID: ${user.id} | ${user.username} | ${user.email} | ${user.user_level} | ${user.created_at}`);
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

listUsers();
