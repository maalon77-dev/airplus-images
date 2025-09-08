const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrateMySQLToFS() {
    // Configuração do MySQL (usar as mesmas variáveis do projeto)
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'airplus_images'
    });

    try {
        console.log('🔄 Iniciando migração do MySQL para sistema de arquivos...');
        
        // Verificar se a tabela images existe
        const [tables] = await connection.execute('SHOW TABLES LIKE "images"');
        if (tables.length === 0) {
            console.log('❌ Tabela images não encontrada no MySQL');
            return;
        }
        
        // Buscar todas as imagens
        const [images] = await connection.execute(`
            SELECT id, filename, image_data, mime_type, user_id, created_at 
            FROM images 
            ORDER BY created_at DESC
        `);
        
        console.log(`📊 Encontradas ${images.length} imagens no MySQL`);
        
        if (images.length === 0) {
            console.log('ℹ️ Nenhuma imagem para migrar');
            return;
        }
        
        // Criar diretório se não existir
        const outputDir = path.resolve(process.cwd(), 'generated-images');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`📁 Diretório criado: ${outputDir}`);
        }
        
        let migrated = 0;
        let errors = 0;
        
        for (const image of images) {
            try {
                const filepath = path.join(outputDir, image.filename);
                
                // Verificar se o arquivo já existe
                if (fs.existsSync(filepath)) {
                    console.log(`⏭️ Arquivo já existe: ${image.filename}`);
                    continue;
                }
                
                // Salvar imagem no sistema de arquivos
                fs.writeFileSync(filepath, image.image_data);
                console.log(`✅ Migrada: ${image.filename} (${image.image_data.length} bytes)`);
                migrated++;
                
            } catch (error) {
                console.error(`❌ Erro ao migrar ${image.filename}:`, error.message);
                errors++;
            }
        }
        
        console.log(`\n🎉 Migração concluída!`);
        console.log(`✅ Imagens migradas: ${migrated}`);
        console.log(`❌ Erros: ${errors}`);
        console.log(`📁 Diretório: ${outputDir}`);
        
        // Listar arquivos migrados
        const files = fs.readdirSync(outputDir);
        console.log(`\n📋 Arquivos no diretório:`);
        files.forEach(file => {
            const filepath = path.join(outputDir, file);
            const stats = fs.statSync(filepath);
            console.log(`  - ${file} (${stats.size} bytes)`);
        });
        
    } catch (error) {
        console.error('❌ Erro na migração:', error.message);
    } finally {
        await connection.end();
    }
}

// Verificar se estamos em desenvolvimento local
if (process.env.NODE_ENV === 'production') {
    console.log('⚠️ Este script é apenas para desenvolvimento local');
    process.exit(1);
}

migrateMySQLToFS();
