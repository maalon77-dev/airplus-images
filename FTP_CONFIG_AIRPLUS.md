# Configuração FTP - AirPlus Digital

## ✅ Teste de Conexão Realizado

**Status**: ✅ **FUNCIONANDO PERFEITAMENTE**

**Credenciais Testadas:**
- **Host**: airplusdigital.com
- **Usuário**: airplusdigital1
- **Senha**: vida1503A@@@@@
- **Porta**: 21
- **Diretório**: /public_html/images

## 🔧 Configuração Local (.env.local)

Crie um arquivo `.env.local` na raiz do projeto com:

```bash
# Modo de armazenamento FTP
NEXT_PUBLIC_IMAGE_STORAGE_MODE=ftp

# Configurações FTP AirPlus Digital
FTP_HOST=airplusdigital.com
FTP_PORT=21
FTP_USER=airplusdigital1
FTP_PASSWORD=vida1503A@@@@@
FTP_SECURE=false
FTP_REMOTE_PATH=/public_html/images
FTP_BASE_URL=https://airplusdigital.com/images
```

## 🚀 Configuração no Vercel

### Opção 1: Via Painel Web
1. Acesse [vercel.com](https://vercel.com)
2. Vá no seu projeto
3. Settings → Environment Variables
4. Adicione cada variável:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_IMAGE_STORAGE_MODE` | `ftp` |
| `FTP_HOST` | `airplusdigital.com` |
| `FTP_PORT` | `21` |
| `FTP_USER` | `airplusdigital1` |
| `FTP_PASSWORD` | `vida1503A@@@@@` |
| `FTP_SECURE` | `false` |
| `FTP_REMOTE_PATH` | `/public_html/images` |
| `FTP_BASE_URL` | `https://airplusdigital.com/images` |

### Opção 2: Via CLI
```bash
vercel env add NEXT_PUBLIC_IMAGE_STORAGE_MODE production
# Digite: ftp

vercel env add FTP_HOST production
# Digite: airplusdigital.com

vercel env add FTP_PORT production
# Digite: 21

vercel env add FTP_USER production
# Digite: airplusdigital1

vercel env add FTP_PASSWORD production
# Digite: vida1503A@@@@@

vercel env add FTP_SECURE production
# Digite: false

vercel env add FTP_REMOTE_PATH production
# Digite: /public_html/images

vercel env add FTP_BASE_URL production
# Digite: https://airplusdigital.com/images
```

## 🧪 Testando a Configuração

### 1. Teste Local
```bash
# Com as variáveis configuradas no .env.local
npm run dev
# Acesse: http://localhost:3000/api/ftp-test
```

### 2. Teste no Vercel
```bash
# Após configurar as variáveis e fazer deploy
# Acesse: https://seu-projeto.vercel.app/api/ftp-test
```

## 📁 Estrutura de Arquivos

**No seu servidor FTP:**
```
/public_html/
  └── images/
      ├── 1757358968835-0.png
      ├── 1757358968836-0.png
      └── ...
```

**URLs das imagens:**
```
https://airplusdigital.com/images/1757358968835-0.png
https://airplusdigital.com/images/1757358968836-0.png
```

## ✅ Funcionalidades

- ✅ **Upload automático** para airplusdigital.com
- ✅ **URLs públicas** das imagens
- ✅ **Histórico mantido** no MySQL
- ✅ **Backup automático** no banco
- ✅ **Teste de conexão** funcionando
- ✅ **Upload e delete** testados

## 🎯 Próximos Passos

1. **Configure as variáveis** no Vercel
2. **Faça um novo deploy**
3. **Teste gerando uma imagem**
4. **Verifique se aparece** em https://airplusdigital.com/images/

**Sistema pronto para usar!** 🎉
