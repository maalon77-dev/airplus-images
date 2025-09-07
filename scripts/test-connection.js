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

async function testConnection() {
    let connection;
    
    try {
        console.log('🔌 Testando conexão com o banco de dados...');
        console.log(`📍 Host: ${config.host}`);
        console.log(`👤 Usuário: ${config.user}`);
        console.log(`🗄️  Database: ${config.database}`);
        
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Testar ping
        await connection.ping();
        console.log('🏓 Ping realizado com sucesso!');

        // Verificar tabelas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📊 Tabelas encontradas:');
        
        if (tables.length === 0) {
            console.log('   ⚠️  Nenhuma tabela encontrada. Execute o script de inicialização.');
        } else {
            tables.forEach(table => {
                const tableName = Object.values(table)[0];
                console.log(`   ✅ ${tableName}`);
            });
        }

        // Verificar configurações
        const [configs] = await connection.execute('SELECT * FROM system_config');
        console.log('⚙️  Configurações do sistema:');
        
        if (configs.length === 0) {
            console.log('   ⚠️  Nenhuma configuração encontrada.');
        } else {
            configs.forEach(config => {
                console.log(`   ${config.config_key}: ${config.config_value}`);
            });
        }

        console.log('🎉 Teste de conexão concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro no teste de conexão:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Verifique as credenciais de acesso.');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('💡 O banco de dados não existe. Execute o script de inicialização.');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('💡 Não foi possível conectar ao servidor. Verifique o host e porta.');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexão fechada.');
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testConnection();
}

module.exports = { testConnection };
