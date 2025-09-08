const { ensureUser14 } = require('./ensure-user14');
const { fixOrphanImages } = require('./fix-orphan-images');

async function postDeployFix() {
    console.log('🚀 Executando correções pós-deploy...');
    
    try {
        // Garantir que o usuário ID 14 está funcionando
        await ensureUser14();
        
        // Corrigir imagens órfãs
        await fixOrphanImages();
        
        console.log('✅ Todas as correções pós-deploy foram executadas com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante correções pós-deploy:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    postDeployFix();
}

module.exports = { postDeployFix };
