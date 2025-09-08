# Configuração FTP para Upload de Imagens

## Variáveis de Ambiente Necessárias

Adicione estas variáveis ao seu arquivo `.env.local`:

```bash
# Modo de armazenamento
NEXT_PUBLIC_IMAGE_STORAGE_MODE=ftp

# Configurações do servidor FTP
FTP_HOST=seu-servidor.com
FTP_PORT=21
FTP_USER=seu-usuario
FTP_PASSWORD=sua-senha
FTP_SECURE=false
FTP_REMOTE_PATH=/public_html/images
FTP_BASE_URL=https://seu-servidor.com/images
```

## Exemplo de Configuração

```bash
# Para um servidor FTP comum
FTP_HOST=ftp.exemplo.com
FTP_PORT=21
FTP_USER=usuario123
FTP_PASSWORD=senha123
FTP_SECURE=false
FTP_REMOTE_PATH=/public_html/images
FTP_BASE_URL=https://exemplo.com/images
```

## Para SFTP (Mais Seguro)

```bash
FTP_HOST=ftp.exemplo.com
FTP_PORT=22
FTP_USER=usuario123
FTP_PASSWORD=senha123
FTP_SECURE=true
FTP_REMOTE_PATH=/public_html/images
FTP_BASE_URL=https://exemplo.com/images
```

## Configuração no Vercel

1. Acesse o painel do Vercel
2. Vá em Settings > Environment Variables
3. Adicione todas as variáveis FTP
4. Faça um novo deploy

## Testando a Conexão

Após configurar, você pode testar a conexão FTP acessando:
- `/api/ftp-test` - Testa a conexão FTP

## Como Funciona

1. **Geração**: Quando uma imagem é gerada, ela é enviada para seu servidor FTP
2. **Histórico**: O histórico continua sendo salvo no MySQL
3. **URLs**: As imagens ficam acessíveis via URLs públicas do seu servidor
4. **Backup**: As imagens também são salvas no MySQL como backup

## Vantagens

- ✅ **Imagens no seu servidor**: Controle total sobre os arquivos
- ✅ **URLs públicas**: Imagens acessíveis diretamente
- ✅ **Histórico mantido**: Sistema de histórico continua funcionando
- ✅ **Backup automático**: Imagens também salvas no MySQL
- ✅ **Segurança**: Suporte a SFTP para conexões seguras
