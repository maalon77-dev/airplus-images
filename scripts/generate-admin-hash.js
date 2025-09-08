const bcrypt = require('bcryptjs');

async function generateAdminHash() {
    const password = 'admin123';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('Senha:', password);
        console.log('Hash gerado:', hash);
        
        // Verificar se o hash está correto
        const isValid = await bcrypt.compare(password, hash);
        console.log('Hash válido:', isValid);
        
        return hash;
    } catch (error) {
        console.error('Erro ao gerar hash:', error);
    }
}

generateAdminHash();
