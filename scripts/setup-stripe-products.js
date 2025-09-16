const Stripe = require('stripe');
const mysql = require('mysql2/promise');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

// Configuração do banco
const dbConfig = {
    host: process.env.MYSQL_HOST || 'criargptimgs.mysql.dbaas.com.br',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'criargptimgs',
    password: process.env.MYSQL_PASSWORD || 'vida1503A@',
    database: process.env.MYSQL_DATABASE || 'criargptimgs',
    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Planos para criar no Stripe
const plans = [
    {
        name: 'Plano Básico',
        description: 'Ideal para usuários casuais - 50 créditos',
        price_usd: 9.99,
        price_brl: 51.95,
        credits_included: 50
    },
    {
        name: 'Plano Profissional',
        description: 'Para profissionais - 150 créditos',
        price_usd: 24.99,
        price_brl: 129.95,
        credits_included: 150
    },
    {
        name: 'Plano Empresarial',
        description: 'Para empresas - 500 créditos',
        price_usd: 79.99,
        price_brl: 415.95,
        credits_included: 500
    },
    {
        name: 'Pacote de Créditos',
        description: 'Créditos extras - 100 créditos',
        price_usd: 19.99,
        price_brl: 103.95,
        credits_included: 100
    }
];

async function setupStripeProducts() {
    let connection;
    
    try {
        console.log('🔌 Conectando ao Stripe...');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia',
        });

        console.log('🔌 Conectando ao banco de dados...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexões estabelecidas!');

        for (const plan of plans) {
            console.log(`\n📦 Criando produto: ${plan.name}`);
            
            // Criar produto no Stripe
            const product = await stripe.products.create({
                name: plan.name,
                description: plan.description,
                metadata: {
                    credits_included: plan.credits_included.toString()
                }
            });

            console.log(`✅ Produto criado: ${product.id}`);

            // Criar preço em USD
            const priceUSD = await stripe.prices.create({
                unit_amount: Math.round(plan.price_usd * 100), // Stripe usa centavos
                currency: 'usd',
                product: product.id,
                metadata: {
                    plan_name: plan.name,
                    credits: plan.credits_included.toString()
                }
            });

            console.log(`✅ Preço USD criado: ${priceUSD.id}`);

            // Criar preço em BRL
            const priceBRL = await stripe.prices.create({
                unit_amount: Math.round(plan.price_brl * 100), // Stripe usa centavos
                currency: 'brl',
                product: product.id,
                metadata: {
                    plan_name: plan.name,
                    credits: plan.credits_included.toString()
                }
            });

            console.log(`✅ Preço BRL criado: ${priceBRL.id}`);

            // Atualizar banco de dados com os IDs do Stripe
            await connection.execute(`
                UPDATE payment_plans 
                SET 
                    stripe_price_id_usd = ?,
                    stripe_price_id_brl = ?
                WHERE name = ?
            `, [priceUSD.id, priceBRL.id, plan.name]);

            console.log(`✅ Banco de dados atualizado para ${plan.name}`);
        }

        console.log('\n🎉 Todos os produtos e preços foram criados no Stripe!');
        
        // Mostrar resumo
        console.log('\n📋 Resumo dos produtos criados:');
        const [updatedPlans] = await connection.execute(`
            SELECT name, stripe_price_id_usd, stripe_price_id_brl, credits_included
            FROM payment_plans 
            ORDER BY price_usd ASC
        `);

        updatedPlans.forEach((plan, index) => {
            console.log(`\n${index + 1}. ${plan.name}`);
            console.log(`   Créditos: ${plan.credits_included}`);
            console.log(`   USD Price ID: ${plan.stripe_price_id_usd}`);
            console.log(`   BRL Price ID: ${plan.stripe_price_id_brl}`);
        });

        console.log('\n🚀 Próximos passos:');
        console.log('1. Configure o webhook no dashboard do Stripe');
        console.log('2. URL do webhook: https://seu-dominio.com/api/payments/webhook');
        console.log('3. Eventos: payment_intent.succeeded, payment_intent.payment_failed');
        console.log('4. Teste os pagamentos com cartões de teste');

    } catch (error) {
        console.error('❌ Erro ao configurar produtos do Stripe:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexão com banco encerrada');
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    setupStripeProducts();
}

module.exports = { setupStripeProducts };
