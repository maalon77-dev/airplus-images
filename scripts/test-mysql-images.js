const mysql = require('mysql2/promise');

async function testMySQLImages() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'airplus_images'
    });

    try {
        console.log('🔍 Verificando imagens no MySQL...');
        
        // Verificar se a tabela images existe
        const [tables] = await connection.execute('SHOW TABLES LIKE "images"');
        if (tables.length === 0) {
            console.log('❌ Tabela images não encontrada');
            return;
        }
        
        // Contar total de imagens
        const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM images');
        console.log(`📊 Total de imagens no banco: ${countResult[0].total}`);
        
        // Listar as últimas 5 imagens
        const [images] = await connection.execute(`
            SELECT id, filename, file_size, mime_type, user_id, created_at 
            FROM images 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        console.log('📋 Últimas 5 imagens:');
        images.forEach((img, index) => {
            console.log(`  ${index + 1}. ${img.filename} (${img.file_size} bytes, ${img.mime_type}, user: ${img.user_id})`);
        });
        
        // Verificar se há imagens sem user_id
        const [orphanImages] = await connection.execute('SELECT COUNT(*) as total FROM images WHERE user_id IS NULL');
        console.log(`⚠️ Imagens sem user_id: ${orphanImages[0].total}`);
        
        // Verificar se há imagens no histórico
        const [historyCount] = await connection.execute('SELECT COUNT(*) as total FROM generation_history');
        console.log(`📚 Total de registros no histórico: ${historyCount[0].total}`);
        
        // Verificar se há imagens no histórico sem user_id
        const [orphanHistory] = await connection.execute('SELECT COUNT(*) as total FROM generation_history WHERE user_id IS NULL');
        console.log(`⚠️ Registros de histórico sem user_id: ${orphanHistory[0].total}`);
        
    } catch (error) {
        console.error('❌ Erro ao verificar MySQL:', error.message);
    } finally {
        await connection.end();
    }
}

testMySQLImages();
