# 🚀 Instruções de Deploy - Sistema de Pagamentos

## ✅ Código Enviado para o GitHub!

### 📋 **Para Deploy no Vercel:**

#### 1. **Acesse o Vercel Dashboard:**
- Vá para [vercel.com](https://vercel.com)
- Conecte o repositório `airplus-images`

#### 2. **Configure as Variáveis de Ambiente:**

No Vercel, vá em **Settings** → **Environment Variables**:

```env
# MySQL
MYSQL_HOST=criargptimgs.mysql.dbaas.com.br
MYSQL_PORT=3306
MYSQL_USER=criargptimgs
MYSQL_PASSWORD=vida1503A@
MYSQL_DATABASE=criargptimgs
MYSQL_SSL=true

# Sistema
NEXT_PUBLIC_IMAGE_STORAGE_MODE=mysql
NEXT_PUBLIC_VERCEL_ENV=production

# OpenAI
OPENAI_API_KEY=sua_chave_openai

# Stripe (use suas chaves reais)
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_webhook
```

#### 3. **Configure Webhook do Stripe:**
- URL: `https://seu-dominio.vercel.app/api/payments/webhook`
- Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 🎯 **Sistema Funcionando:**
- ✅ Pagamentos USD/BRL
- ✅ Sistema de créditos
- ✅ Interface moderna
- ✅ Webhooks automáticos
- ✅ Segurança PCI compliant

### 🧪 **Teste com Cartões:**
- Sucesso: `4242 4242 4242 4242`
- Falha: `4000 0000 0000 0002`

**Pronto para produção!** 🚀
