// Configuração do banco MySQL
// Configure estas variáveis de ambiente no seu provedor de hospedagem

export const mysqlConfig = {
    host: process.env.MYSQL_HOST || 'criargptimgs.mysql.dbaas.com.br',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'criargptimgs',
    password: process.env.MYSQL_PASSWORD || 'vida1503A@',
    database: process.env.MYSQL_DATABASE || 'criargptimgs',
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || '10'),
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : true
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
