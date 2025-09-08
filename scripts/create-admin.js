const bcrypt = require('bcryptjs');

async function createAdmin() {
    const username = 'admin2';
    const password = 'admin123';
    const userLevel = 'ADMIN_SUPREMO';
    
    try {
        // Primeiro, fazer login como admin principal para obter o token
        console.log('🔐 Fazendo login como admin principal...');
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            }),
        });

        if (!loginResponse.ok) {
            throw new Error('Falha no login do admin principal');
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login realizado com sucesso!');

        // Extrair o cookie de autenticação
        const setCookieHeader = loginResponse.headers.get('set-cookie');
        const authToken = setCookieHeader?.match(/auth-token=([^;]+)/)?.[1];
        
        if (!authToken) {
            throw new Error('Token de autenticação não encontrado');
        }

        // Criar novo admin
        console.log('👤 Criando novo admin...');
        const createResponse = await fetch('http://localhost:3000/api/users/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `auth-token=${authToken}`
            },
            body: JSON.stringify({
                username,
                password,
                userLevel
            }),
        });

        if (!createResponse.ok) {
            const errorData = await createResponse.json();
            throw new Error(errorData.error || 'Falha ao criar admin');
        }

        const createData = await createResponse.json();
        console.log('✅ Novo admin criado com sucesso!');
        console.log('📋 Detalhes do novo admin:');
        console.log(`   Username: ${createData.user.username}`);
        console.log(`   Nível: ${createData.user.userLevel}`);
        console.log(`   ID: ${createData.user.id}`);

        // Testar login com o novo admin
        console.log('🔐 Testando login com o novo admin...');
        const testLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password
            }),
        });

        if (testLoginResponse.ok) {
            console.log('✅ Login com novo admin funcionando perfeitamente!');
        } else {
            console.log('❌ Erro no login com novo admin');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

createAdmin();
