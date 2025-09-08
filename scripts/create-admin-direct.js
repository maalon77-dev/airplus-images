const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// Configurações do banco
const config = {
    host: 'criargptimgs.mysql.dbaas.com.br',
    port: 3306,
    user: 'criargptimgs',
    password: 'vida1503A@',
    database: 'criargptimgs',
    ssl: { rejectUnauthorized: false }
};

async function createAdminDirect() {
    const username = 'admin2';
    const password = 'admin123';
    const userLevel = 'ADMIN_SUPREMO';
    
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Verificar se o usuário já existe
        console.log('🔍 Verificando se o usuário já existe...');
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            console.log('⚠️  Usuário já existe! Atualizando senha...');
            
            // Gerar novo hash da senha
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            // Atualizar senha
            await connection.execute(
                'UPDATE users SET password_hash = ? WHERE username = ?',
                [passwordHash, username]
            );
            
            console.log('✅ Senha do usuário atualizada com sucesso!');
        } else {
            console.log('👤 Criando novo admin...');
            
            // Gerar hash da senha
            const saltRounds = 10;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            // Inserir novo usuário
            const [result] = await connection.execute(
                'INSERT INTO users (username, password_hash, user_level) VALUES (?, ?, ?)',
                [username, passwordHash, userLevel]
            );
            
            console.log('✅ Novo admin criado com sucesso!');
            console.log(`📋 ID do novo admin: ${result.insertId}`);
        }

        // Listar todos os usuários
        console.log('📋 Listando todos os usuários:');
        const [users] = await connection.execute(
            'SELECT id, username, user_level, created_at FROM users ORDER BY created_at DESC'
        );
        
        users.forEach(user => {
            console.log(`   ${user.id} | ${user.username} | ${user.user_level} | ${user.created_at}`);
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

createAdminDirect();
