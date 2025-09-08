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

async function directFix() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Verificar estrutura da tabela
        console.log('🔍 Verificando estrutura da tabela users...');
        const [columns] = await connection.execute('DESCRIBE users');
        console.log('Colunas da tabela users:');
        columns.forEach(col => {
            console.log(`   ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra}`);
        });

        // Verificar valores atuais
        console.log('\n📋 Valores atuais na tabela:');
        const [users] = await connection.execute('SELECT * FROM users');
        users.forEach(user => {
            console.log(`   ID: ${user.id}, Username: ${user.username}, Level: "${user.user_level}"`);
        });

        // Corrigir usando UPDATE direto
        console.log('\n🔧 Aplicando correções diretas...');
        
        // admin2
        await connection.execute(
            'UPDATE users SET user_level = "ADMIN_SUPREMO" WHERE id = 4'
        );
        console.log('✅ admin2 (ID: 4) -> ADMIN_SUPREMO');

        // admin_supremo
        await connection.execute(
            'UPDATE users SET user_level = "ADMIN_SUPREMO" WHERE id = 1'
        );
        console.log('✅ admin_supremo (ID: 1) -> ADMIN_SUPREMO');

        // admin
        await connection.execute(
            'UPDATE users SET user_level = "ADMIN_SUPREMO" WHERE id = 2'
        );
        console.log('✅ admin (ID: 2) -> ADMIN_SUPREMO');

        // usuario_teste
        await connection.execute(
            'UPDATE users SET user_level = "USUARIO" WHERE id = 3'
        );
        console.log('✅ usuario_teste (ID: 3) -> USUARIO');

        // Verificar resultado final
        console.log('\n📋 Resultado final:');
        const [finalUsers] = await connection.execute('SELECT * FROM users ORDER BY id');
        finalUsers.forEach(user => {
            const levelIcon = user.user_level === 'ADMIN_SUPREMO' ? '👑' : '👤';
            console.log(`   ${levelIcon} ID: ${user.id} | ${user.username} | "${user.user_level}"`);
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

directFix();
