# 🔧 Configuração de Variáveis de Ambiente no Vercel

## 📋 Variáveis que DEVEM estar configuradas no Vercel:

### **No Dashboard do Vercel:**
1. Vá em **Settings** > **Environment Variables**
2. Adicione as seguintes variáveis:

```
MYSQL_HOST=criargptimgs.mysql.dbaas.com.br
MYSQL_PORT=3306
MYSQL_USER=criargptimgs
MYSQL_PASSWORD=vida1503A@
MYSQL_DATABASE=criargptimgs
MYSQL_SSL=true
JWT_SECRET=sua_chave_jwt_secreta_muito_longa_e_segura
```

### **⚠️ IMPORTANTE:**
- **JWT_SECRET** é obrigatório para autenticação funcionar
- Use uma chave longa e segura (ex: `minha_chave_super_secreta_123456789`)
- Marque todas as variáveis para **Production**, **Preview** e **Development**

## 🔄 Após configurar as variáveis:
1. Vá em **Deployments**
2. Clique nos 3 pontos do último deploy
3. Selecione **"Redeploy"**

## 🧪 Teste após o redeploy:
1. Acesse: `https://airplus-images.vercel.app`
2. Tente fazer login com: `admin2` / `admin123`
3. Verifique se o painel de gerenciamento aparece
