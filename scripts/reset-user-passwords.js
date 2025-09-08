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

async function resetUserPasswords() {
    const connection = await mysql.createConnection(config);
    
    try {
        console.log('🔐 Resetando senhas dos usuários...');
        
        // Resetar senha do admin
        const adminPasswordHash = await bcrypt.hash('admin123', 10);
        await connection.execute(
            'UPDATE users SET password_hash = ? WHERE username = ?',
            [adminPasswordHash, 'admin2']
        );
        console.log('✅ Senha do admin2 resetada para: admin123');
        
        // Resetar senhas dos usuários normais
        const userPasswordHash = await bcrypt.hash('teste123', 10);
        await connection.execute(
            'UPDATE users SET password_hash = ? WHERE user_level = ?',
            [userPasswordHash, 'USUARIO']
        );
        console.log('✅ Senhas dos usuários normais resetadas para: teste123');
        
        // Listar todos os usuários
        const [users] = await connection.execute('SELECT username, user_level FROM users ORDER BY user_level, username');
        console.log('\n📋 Usuários disponíveis:');
        users.forEach(user => {
            const password = user.user_level === 'ADMIN_SUPREMO' ? 'admin123' : 'teste123';
            console.log(`   👤 ${user.username} (${user.user_level}) - Senha: ${password}`);
        });
        
        console.log('\n🎉 Reset de senhas concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao resetar senhas:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    resetUserPasswords();
}

module.exports = { resetUserPasswords };
