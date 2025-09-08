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

async function fixAdmin2Level() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Verificar o nível atual do admin2
        console.log('🔍 Verificando nível atual do admin2...');
        const [currentUser] = await connection.execute(
            'SELECT id, username, user_level FROM users WHERE username = ?',
            ['admin2']
        );

        if (currentUser.length === 0) {
            console.log('❌ Usuário admin2 não encontrado!');
            return;
        }

        const user = currentUser[0];
        console.log(`📋 Usuário encontrado: ${user.username} - Nível atual: ${user.user_level}`);

        if (user.user_level === 'ADMIN_SUPREMO') {
            console.log('✅ Usuário já está como ADMIN_SUPREMO!');
        } else {
            console.log('🔧 Atualizando nível para ADMIN_SUPREMO...');
            await connection.execute(
                'UPDATE users SET user_level = ? WHERE username = ?',
                ['ADMIN_SUPREMO', 'admin2']
            );
            console.log('✅ Nível atualizado com sucesso!');
        }

        // Listar todos os usuários para verificar
        console.log('📋 Listando todos os usuários:');
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

fixAdmin2Level();
