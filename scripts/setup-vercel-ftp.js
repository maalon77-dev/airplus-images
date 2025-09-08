const { execSync } = require('child_process');

console.log('🚀 Configurando variáveis de ambiente FTP no Vercel...');

const ftpEnvVars = {
    'NEXT_PUBLIC_IMAGE_STORAGE_MODE': 'ftp',
    'FTP_HOST': 'airplusdigital.com',
    'FTP_PORT': '21',
    'FTP_USER': 'airplusdigital1',
    'FTP_PASSWORD': 'vida1503A@@@@@',
    'FTP_SECURE': 'false',
    'FTP_REMOTE_PATH': '/public_html/images',
    'FTP_BASE_URL': 'https://airplusdigital.com/images'
};

console.log('📋 Variáveis a serem configuradas:');
Object.entries(ftpEnvVars).forEach(([key, value]) => {
    console.log(`  ${key}=${value}`);
});

console.log('\n🔄 Executando comandos Vercel...');

try {
    // Configurar cada variável
    Object.entries(ftpEnvVars).forEach(([key, value]) => {
        console.log(`📝 Configurando ${key}...`);
        const command = `vercel env add ${key} production`;
        console.log(`Executando: ${command}`);
        
        try {
            // Simular entrada da variável
            const result = execSync(`echo "${value}" | vercel env add ${key} production`, { 
                encoding: 'utf8',
                stdio: 'pipe'
            });
            console.log(`✅ ${key} configurado com sucesso`);
        } catch (error) {
            console.log(`⚠️ Erro ao configurar ${key}:`, error.message);
        }
    });
    
    console.log('\n🎉 Configuração concluída!');
    console.log('📝 Para verificar as variáveis, execute: vercel env ls');
    console.log('🚀 Para aplicar as mudanças, faça um novo deploy');
    
} catch (error) {
    console.error('❌ Erro na configuração:', error.message);
    console.log('\n📋 Comandos manuais para configurar:');
    Object.entries(ftpEnvVars).forEach(([key, value]) => {
        console.log(`vercel env add ${key} production`);
        console.log(`# Digite: ${value}`);
    });
}
