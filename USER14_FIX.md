# Correção do Usuário ID 14 (jhully)

## Problema
O usuário ID 14 (jhully) para de funcionar após cada deploy no Vercel, necessitando ser excluído e recriado manualmente.

## Solução Implementada

### Scripts de Correção Automática

1. **`scripts/ensure-user14.js`** - Garante que o usuário ID 14 existe e está funcionando
2. **`scripts/post-deploy-fix.js`** - Executa todas as correções pós-deploy
3. **`scripts/fix-orphan-images.js`** - Corrige imagens órfãs sem histórico

### Comandos Disponíveis

```bash
# Corrigir apenas o usuário ID 14
npm run fix-user14

# Corrigir imagens órfãs
npm run fix-orphans

# Executar todas as correções pós-deploy
npm run post-deploy
```

### O que os Scripts Fazem

#### `ensure-user14.js`
- ✅ Verifica se o usuário ID 14 existe
- ✅ Cria o usuário se não existir
- ✅ Verifica se a senha está correta (teste123)
- ✅ Atualiza a senha se necessário
- ✅ Ativa o usuário se estiver inativo
- ✅ Corrige imagens órfãs do usuário

#### `post-deploy-fix.js`
- ✅ Executa `ensure-user14.js`
- ✅ Executa `fix-orphan-images.js`
- ✅ Garante que tudo está funcionando após deploy

### Como Usar Após Deploy

1. **Após cada deploy no Vercel**, execute:
   ```bash
   npm run post-deploy
   ```

2. **Ou execute individualmente**:
   ```bash
   npm run fix-user14
   ```

### Informações do Usuário ID 14

- **Username**: jhully
- **Senha**: teste123
- **Nível**: USUARIO
- **Email**: jhully@localhost

### Verificação Manual

Para verificar se o usuário está funcionando:

```bash
# Testar login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "jhully", "password": "teste123"}'

# Verificar histórico
curl -b cookies_jhully.txt http://localhost:3001/api/mysql-history
```

### Prevenção

Para evitar o problema no futuro:

1. **Sempre execute** `npm run post-deploy` após cada deploy
2. **Monitore** se o usuário ID 14 está funcionando
3. **Use os scripts** em vez de criar/excluir manualmente

### Logs

Os scripts fornecem logs detalhados:
- ✅ Sucesso
- ❌ Erro
- 🔧 Correção em andamento
- 🔍 Verificação
- 🎉 Concluído

### Troubleshooting

Se o usuário ainda não funcionar após executar os scripts:

1. Verifique a conexão com o banco de dados
2. Execute `npm run db:test` para testar a conexão
3. Verifique se as variáveis de ambiente estão corretas
4. Execute `npm run fix-user14` novamente
