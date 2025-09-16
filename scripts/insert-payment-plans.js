const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'criargptimgs',
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Planos de pagamento padrão
const defaultPlans = [
    {
        name: 'Plano Básico',
        description: 'Ideal para usuários casuais - 50 créditos',
        price_usd: 9.99,
        price_brl: 51.95,
        credits_included: 50,
        stripe_price_id_usd: 'price_basic_usd', // Será configurado no Stripe
        stripe_price_id_brl: 'price_basic_brl'
    },
    {
        name: 'Plano Profissional',
        description: 'Para profissionais - 150 créditos',
        price_usd: 24.99,
        price_brl: 129.95,
        credits_included: 150,
        stripe_price_id_usd: 'price_pro_usd',
        stripe_price_id_brl: 'price_pro_brl'
    },
    {
        name: 'Plano Empresarial',
        description: 'Para empresas - 500 créditos',
        price_usd: 79.99,
        price_brl: 415.95,
        credits_included: 500,
        stripe_price_id_usd: 'price_enterprise_usd',
        stripe_price_id_brl: 'price_enterprise_brl'
    },
    {
        name: 'Pacote de Créditos',
        description: 'Créditos extras - 100 créditos',
        price_usd: 19.99,
        price_brl: 103.95,
        credits_included: 100,
        stripe_price_id_usd: 'price_credits_usd',
        stripe_price_id_brl: 'price_credits_brl'
    }
];

async function insertPaymentPlans() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado ao banco de dados');

        // Verificar se já existem planos
        const [existingPlans] = await connection.execute(
            'SELECT COUNT(*) as count FROM payment_plans'
        );

        if (existingPlans[0].count > 0) {
            console.log('⚠️  Planos de pagamento já existem no banco. Pulando inserção.');
            return;
        }

        console.log('📦 Inserindo planos de pagamento padrão...');

        for (const plan of defaultPlans) {
            await connection.execute(
                `INSERT INTO payment_plans 
                (name, description, price_usd, price_brl, credits_included, stripe_price_id_usd, stripe_price_id_brl) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    plan.name,
                    plan.description,
                    plan.price_usd,
                    plan.price_brl,
                    plan.credits_included,
                    plan.stripe_price_id_usd,
                    plan.stripe_price_id_brl
                ]
            );
            console.log(`✅ Plano inserido: ${plan.name}`);
        }

        console.log('🎉 Todos os planos de pagamento foram inseridos com sucesso!');
        
        // Mostrar planos inseridos
        const [plans] = await connection.execute(
            'SELECT id, name, price_usd, price_brl, credits_included FROM payment_plans ORDER BY price_usd'
        );
        
        console.log('\n📋 Planos disponíveis:');
        plans.forEach(plan => {
            console.log(`  ${plan.id}. ${plan.name} - $${plan.price_usd} / R$${plan.price_brl} (${plan.credits_included} créditos)`);
        });

    } catch (error) {
        console.error('❌ Erro ao inserir planos de pagamento:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexão com banco de dados encerrada');
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    insertPaymentPlans();
}

module.exports = { insertPaymentPlans, defaultPlans };
