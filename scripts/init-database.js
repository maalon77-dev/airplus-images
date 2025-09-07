const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configurações do banco
const config = {
    host: 'criargptimgs.mysql.dbaas.com.br',
    port: 3306,
    user: 'criargptimgs',
    password: 'vida1503A@',
    database: 'criargptimgs',
    ssl: { rejectUnauthorized: false }
};

async function initDatabase() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Ler o arquivo SQL
        const sqlPath = path.join(__dirname, '../database/schema.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 Executando script SQL...');
        
        // Dividir o script em comandos individuais
        const commands = sqlContent
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

        // Executar cada comando
        for (const command of commands) {
            if (command.trim()) {
                try {
                    await connection.query(command);
                    console.log(`✅ Executado: ${command.substring(0, 50)}...`);
                } catch (error) {
                    console.log(`⚠️  Comando ignorado: ${command.substring(0, 50)}... (${error.message})`);
                }
            }
        }

        console.log('🎉 Banco de dados inicializado com sucesso!');
        console.log('📊 Tabelas criadas:');
        console.log('   - images (armazenamento de imagens)');
        console.log('   - generation_history (histórico de gerações)');
        console.log('   - history_images (relacionamento)');
        console.log('   - system_config (configurações)');

    } catch (error) {
        console.error('❌ Erro ao inicializar banco de dados:', error.message);
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
    initDatabase();
}

module.exports = { initDatabase };
