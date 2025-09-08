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

async function finalFixLevels() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Corrigir cada usuário individualmente
        console.log('🔧 Corrigindo níveis individuais...');
        
        // admin2 -> ADMIN_SUPREMO
        await connection.execute(
            'UPDATE users SET user_level = ? WHERE username = ?',
            ['ADMIN_SUPREMO', 'admin2']
        );
        console.log('✅ admin2 -> ADMIN_SUPREMO');

        // admin_supremo -> ADMIN_SUPREMO
        await connection.execute(
            'UPDATE users SET user_level = ? WHERE username = ?',
            ['ADMIN_SUPREMO', 'admin_supremo']
        );
        console.log('✅ admin_supremo -> ADMIN_SUPREMO');

        // admin -> ADMIN_SUPREMO
        await connection.execute(
            'UPDATE users SET user_level = ? WHERE username = ?',
            ['ADMIN_SUPREMO', 'admin']
        );
        console.log('✅ admin -> ADMIN_SUPREMO');

        // usuario_teste -> USUARIO
        await connection.execute(
            'UPDATE users SET user_level = ? WHERE username = ?',
            ['USUARIO', 'usuario_teste']
        );
        console.log('✅ usuario_teste -> USUARIO');

        // Listar todos os usuários para verificar
        console.log('📋 Listando todos os usuários após correção final:');
        const [users] = await connection.execute(
            'SELECT id, username, user_level, created_at FROM users ORDER BY created_at DESC'
        );
        
        users.forEach(user => {
            const levelIcon = user.user_level === 'ADMIN_SUPREMO' ? '👑' : '👤';
            const levelText = user.user_level || 'SEM NÍVEL';
            console.log(`   ${levelIcon} ${user.id} | ${user.username} | ${levelText} | ${user.created_at}`);
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

finalFixLevels();
