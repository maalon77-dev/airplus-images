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

async function checkTableStructure() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Verificar estrutura da tabela users
        console.log('🔍 Verificando estrutura da tabela users...');
        const [columns] = await connection.execute('DESCRIBE users');
        console.log('Colunas da tabela users:');
        columns.forEach(col => {
            console.log(`   ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra}`);
        });

        // Verificar se há constraints NOT NULL
        console.log('\n🔍 Verificando constraints NOT NULL:');
        const notNullColumns = columns.filter(col => col.Null === 'NO' && col.Default === null);
        console.log('Colunas NOT NULL sem default:');
        notNullColumns.forEach(col => {
            console.log(`   ❌ ${col.Field} - ${col.Type}`);
        });

        // Testar inserção manual
        console.log('\n🧪 Testando inserção manual...');
        try {
            const [result] = await connection.execute(
                'INSERT INTO users (username, password_hash, user_level) VALUES (?, ?, ?)',
                ['teste_manual', 'hash_teste', 'USUARIO']
            );
            console.log('✅ Inserção manual funcionou! ID:', result.insertId);
            
            // Deletar o teste
            await connection.execute('DELETE FROM users WHERE id = ?', [result.insertId]);
            console.log('✅ Teste removido');
        } catch (error) {
            console.error('❌ Erro na inserção manual:', error.message);
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexão fechada.');
        }
    }
}

checkTableStructure();
