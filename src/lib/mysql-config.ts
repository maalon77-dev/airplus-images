// Configuração do banco MySQL
// Configure estas variáveis de ambiente no seu provedor de hospedagem

export const mysqlConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'gpt_images_db',
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || '10'),
    acquireTimeout: parseInt(process.env.MYSQL_ACQUIRE_TIMEOUT || '60000'),
    timeout: parseInt(process.env.MYSQL_TIMEOUT || '60000'),
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Para hospedagem compartilhada, você pode precisar ajustar estas configurações
export const getConnectionString = () => {
    if (process.env.DATABASE_URL) {
        // Para serviços como PlanetScale, Railway, etc.
        return process.env.DATABASE_URL;
    }
    
    // Para conexão tradicional
    return `mysql://${mysqlConfig.user}:${mysqlConfig.password}@${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`;
};
