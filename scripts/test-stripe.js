const Stripe = require('stripe');

// Carregar variáveis de ambiente
require('dotenv').config({ path: '.env.local' });

async function testStripeConnection() {
    try {
        console.log('🔌 Testando conexão com Stripe...');
        
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('❌ STRIPE_SECRET_KEY não encontrada no .env.local');
            return;
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2024-12-18.acacia',
        });

        // Testar conexão listando produtos
        console.log('📦 Listando produtos do Stripe...');
        const products = await stripe.products.list({ limit: 5 });
        
        console.log(`✅ Conexão com Stripe bem-sucedida!`);
        console.log(`📊 Encontrados ${products.data.length} produtos:`);
        
        products.data.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name} (ID: ${product.id})`);
        });

        // Testar criação de um produto de teste
        console.log('\n🧪 Criando produto de teste...');
        const testProduct = await stripe.products.create({
            name: 'Teste - Plano Básico',
            description: 'Produto de teste para verificar integração',
        });

        console.log(`✅ Produto de teste criado: ${testProduct.id}`);

        // Criar preço de teste
        const testPrice = await stripe.prices.create({
            unit_amount: 999, // $9.99
            currency: 'usd',
            product: testProduct.id,
        });

        console.log(`✅ Preço de teste criado: ${testPrice.id}`);

        // Limpar produto de teste
        await stripe.products.del(testProduct.id);
        console.log('🧹 Produto de teste removido');

        console.log('\n🎉 Teste do Stripe concluído com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no .env.local');
        console.log('2. Crie produtos e preços reais no dashboard do Stripe');
        console.log('3. Configure webhook para /api/payments/webhook');
        console.log('4. Atualize os stripe_price_id_* no banco de dados');

    } catch (error) {
        console.error('❌ Erro ao testar Stripe:', error.message);
        
        if (error.type === 'StripeAuthenticationError') {
            console.error('🔑 Erro de autenticação - verifique sua chave secreta');
        } else if (error.type === 'StripeInvalidRequestError') {
            console.error('📝 Erro na requisição - verifique os parâmetros');
        } else {
            console.error('🔧 Erro geral:', error);
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    testStripeConnection();
}

module.exports = { testStripeConnection };
