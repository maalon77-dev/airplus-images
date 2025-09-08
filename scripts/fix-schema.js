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

async function fixSchema() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Alterar o ENUM para usar os valores corretos
        console.log('🔧 Alterando ENUM da coluna user_level...');
        
        await connection.execute(`
            ALTER TABLE users 
            MODIFY COLUMN user_level ENUM('ADMIN_SUPREMO', 'USUARIO') 
            NOT NULL DEFAULT 'USUARIO'
        `);
        console.log('✅ ENUM alterado para ADMIN_SUPREMO, USUARIO');

        // Atualizar os valores existentes
        console.log('🔧 Atualizando valores existentes...');
        
        // admin_supremo -> ADMIN_SUPREMO
        await connection.execute(
            'UPDATE users SET user_level = "ADMIN_SUPREMO" WHERE user_level = "admin_supremo"'
        );
        console.log('✅ admin_supremo -> ADMIN_SUPREMO');

        // admin -> ADMIN_SUPREMO
        await connection.execute(
            'UPDATE users SET user_level = "ADMIN_SUPREMO" WHERE user_level = "admin"'
        );
        console.log('✅ admin -> ADMIN_SUPREMO');

        // usuario_normal -> USUARIO
        await connection.execute(
            'UPDATE users SET user_level = "USUARIO" WHERE user_level = "usuario_normal"'
        );
        console.log('✅ usuario_normal -> USUARIO');

        // Corrigir valores vazios
        await connection.execute(
            'UPDATE users SET user_level = "USUARIO" WHERE user_level = "" OR user_level IS NULL'
        );
        console.log('✅ Valores vazios -> USUARIO');

        // Verificar resultado final
        console.log('\n📋 Resultado final:');
        const [finalUsers] = await connection.execute('SELECT * FROM users ORDER BY id');
        finalUsers.forEach(user => {
            const levelIcon = user.user_level === 'ADMIN_SUPREMO' ? '👑' : '👤';
            console.log(`   ${levelIcon} ID: ${user.id} | ${user.username} | "${user.user_level}"`);
        });

        // Verificar estrutura final
        console.log('\n🔍 Estrutura final da coluna user_level:');
        const [columns] = await connection.execute('DESCRIBE users');
        const userLevelColumn = columns.find(col => col.Field === 'user_level');
        console.log(`   ${userLevelColumn.Field} | ${userLevelColumn.Type} | ${userLevelColumn.Default}`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexão fechada.');
        }
    }
}

fixSchema();
