const fs = require('fs');
const path = require('path');

function clearOldHistory() {
    console.log('🧹 Limpando histórico antigo...');
    
    // Limpar diretório de imagens geradas
    const outputDir = path.resolve(process.cwd(), 'generated-images');
    if (fs.existsSync(outputDir)) {
        const files = fs.readdirSync(outputDir);
        console.log(`📁 Encontrados ${files.length} arquivos em generated-images/`);
        
        files.forEach(file => {
            const filepath = path.join(outputDir, file);
            try {
                fs.unlinkSync(filepath);
                console.log(`🗑️ Removido: ${file}`);
            } catch (error) {
                console.error(`❌ Erro ao remover ${file}:`, error.message);
            }
        });
    }
    
    // Limpar cache do navegador (localStorage)
    console.log('\n💡 Para limpar o cache do navegador:');
    console.log('1. Abra o DevTools (F12)');
    console.log('2. Vá em Application > Storage > Local Storage');
    console.log('3. Delete todas as entradas relacionadas ao histórico');
    console.log('4. Recarregue a página');
    
    console.log('\n✅ Limpeza concluída!');
    console.log('🔄 Agora você pode gerar novas imagens que serão salvas localmente');
}

clearOldHistory();
