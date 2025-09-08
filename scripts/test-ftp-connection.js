const { Client } = require('basic-ftp');

async function testFTPConnection() {
    const client = new Client();
    
    const config = {
        host: 'airplusdigital.com',
        port: 21,
        user: 'airplusdigital1',
        password: 'vida1503A@@@@@',
        secure: false
    };

    try {
        console.log('🔄 Testando conexão FTP...');
        console.log('📡 Host:', config.host);
        console.log('👤 Usuário:', config.user);
        console.log('🔒 Porta:', config.port);
        console.log('🔐 Seguro:', config.secure);
        
        await client.access(config);
        console.log('✅ Conexão FTP estabelecida com sucesso!');
        
        // Listar diretório atual
        const list = await client.list();
        console.log('📁 Conteúdo do diretório atual:');
        list.forEach(item => {
            console.log(`  - ${item.name} (${item.type === 1 ? 'arquivo' : 'diretório'})`);
        });
        
        // Testar criação de diretório
        const testDir = '/public_html/images';
        console.log(`📁 Testando acesso ao diretório: ${testDir}`);
        
        try {
            await client.ensureDir(testDir);
            console.log(`✅ Diretório ${testDir} acessível/criado com sucesso!`);
        } catch (dirError) {
            console.log(`⚠️ Problema com diretório ${testDir}:`, dirError.message);
        }
        
        // Testar upload de arquivo
        const testContent = 'Teste de upload FTP - ' + new Date().toISOString();
        const testFilename = 'test-ftp-' + Date.now() + '.txt';
        
        console.log(`📤 Testando upload de arquivo: ${testFilename}`);
        
        // Usar writeFile para criar arquivo temporário
        const fs = require('fs');
        const path = require('path');
        const tempFile = path.join(__dirname, 'temp-ftp-test.txt');
        
        fs.writeFileSync(tempFile, testContent);
        
        try {
            await client.uploadFrom(tempFile, testFilename);
            console.log(`✅ Upload de teste realizado com sucesso!`);
            
            // Deletar arquivo de teste
            await client.remove(testFilename);
            console.log(`🗑️ Arquivo de teste removido`);
        } finally {
            // Limpar arquivo temporário
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        }
        
        console.log('🎉 Todos os testes FTP passaram com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na conexão FTP:', error.message);
        console.error('🔍 Detalhes do erro:', error);
    } finally {
        client.close();
    }
}

testFTPConnection();
