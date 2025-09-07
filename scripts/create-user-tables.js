const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Configurações do banco
const config = {
    host: 'criargptimgs.mysql.dbaas.com.br',
    port: 3306,
    user: 'criargptimgs',
    password: 'vida1503A@',
    database: 'criargptimgs',
    ssl: { rejectUnauthorized: false }
};

async function createUserTables() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(config);
        console.log('✅ Conexão estabelecida com sucesso!');

        // Criar tabela users
        console.log('📄 Criando tabela users...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                user_level ENUM('admin_supremo', 'admin', 'usuario_normal') NOT NULL DEFAULT 'usuario_normal',
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                last_login TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_user_level (user_level),
                INDEX idx_is_active (is_active)
            )
        `);
        console.log('✅ Tabela users criada!');

        // Criar tabela user_sessions
        console.log('📄 Criando tabela user_sessions...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                session_token VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_session_token (session_token),
                INDEX idx_user_id (user_id),
                INDEX idx_expires_at (expires_at)
            )
        `);
        console.log('✅ Tabela user_sessions criada!');

        // Criar tabela user_activity_logs
        console.log('📄 Criando tabela user_activity_logs...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_activity_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                activity_type ENUM('login', 'logout', 'image_generated', 'image_deleted', 'history_cleared', 'user_created', 'user_updated', 'user_deleted') NOT NULL,
                description TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id),
                INDEX idx_activity_type (activity_type),
                INDEX idx_created_at (created_at)
            )
        `);
        console.log('✅ Tabela user_activity_logs criada!');

        // Criar usuários padrão
        console.log('👤 Criando usuários padrão...');
        
        // Hash das senhas
        const adminSupremoSenha = await bcrypt.hash('admin123', 10);
        const adminSenha = await bcrypt.hash('admin456', 10);
        const usuarioSenha = await bcrypt.hash('user789', 10);

        // Inserir usuários
        await connection.query(`
            INSERT INTO users (username, email, password_hash, user_level, is_active) VALUES 
            ('admin_supremo', 'admin@criargptimgs.com', ?, 'admin_supremo', TRUE),
            ('admin', 'admin2@criargptimgs.com', ?, 'admin', TRUE),
            ('usuario_teste', 'usuario@criargptimgs.com', ?, 'usuario_normal', TRUE)
            ON DUPLICATE KEY UPDATE 
                password_hash = VALUES(password_hash),
                user_level = VALUES(user_level),
                is_active = VALUES(is_active)
        `, [adminSupremoSenha, adminSenha, usuarioSenha]);

        console.log('✅ Usuários padrão criados!');

        // Atualizar configurações do sistema
        console.log('⚙️ Atualizando configurações do sistema...');
        await connection.query(`
            INSERT INTO system_config (config_key, config_value) VALUES 
            ('default_user_level', 'usuario_normal'),
            ('session_timeout_hours', '24'),
            ('max_login_attempts', '5'),
            ('password_min_length', '8')
            ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
        `);
        console.log('✅ Configurações atualizadas!');

        console.log('🎉 Sistema de usuários criado com sucesso!');
        console.log('');
        console.log('👤 USUÁRIOS CRIADOS:');
        console.log('   🔴 ADMIN SUPREMO:');
        console.log('      Usuário: admin_supremo');
        console.log('      Senha: admin123');
        console.log('      Email: admin@criargptimgs.com');
        console.log('');
        console.log('   🟡 ADMIN:');
        console.log('      Usuário: admin');
        console.log('      Senha: admin456');
        console.log('      Email: admin2@criargptimgs.com');
        console.log('');
        console.log('   🟢 USUÁRIO NORMAL:');
        console.log('      Usuário: usuario_teste');
        console.log('      Senha: user789');
        console.log('      Email: usuario@criargptimgs.com');

    } catch (error) {
        console.error('❌ Erro ao criar sistema de usuários:', error.message);
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
    createUserTables();
}

module.exports = { createUserTables };
