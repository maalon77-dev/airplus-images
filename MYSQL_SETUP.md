# Configuração do MySQL para o Sistema de Geração de Imagens

## 1. Configuração do Banco de Dados

### Execute o script SQL
Execute o arquivo `database/schema.sql` no seu banco MySQL para criar as tabelas necessárias.

### Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com as seguintes configurações:

```env
# Configurações do MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha
MYSQL_DATABASE=gpt_images_db

# Configurações avançadas (opcionais)
MYSQL_CONNECTION_LIMIT=10
MYSQL_ACQUIRE_TIMEOUT=60000
MYSQL_TIMEOUT=60000
MYSQL_SSL=false

# Para serviços de banco em nuvem (opcional)
# DATABASE_URL=mysql://usuario:senha@host:porta/database

# Configurações do sistema
NEXT_PUBLIC_IMAGE_STORAGE_MODE=mysql
```

## 2. Configuração para Hospedagem Compartilhada

### Para cPanel/phpMyAdmin:
1. Acesse o phpMyAdmin
2. Execute o script `database/schema.sql`
3. Configure as variáveis de ambiente no painel de controle

### Para provedores como Hostinger, HostGator, etc:
1. Crie o banco de dados via cPanel
2. Execute o script SQL
3. Configure as variáveis de ambiente

## 3. Configuração para Hospedagem em Nuvem

### Vercel + PlanetScale:
```env
DATABASE_URL=mysql://usuario:senha@host.planetscale.com/database?sslaccept=strict
```

### Railway:
```env
DATABASE_URL=mysql://usuario:senha@containers-us-west-xxx.railway.app:porta/railway
```

### Supabase:
```env
DATABASE_URL=postgresql://usuario:senha@db.xxx.supabase.co:5432/postgres
```

## 4. Testando a Conexão

Após configurar, acesse:
- `https://seudominio.com/api/mysql-test` para testar a conexão

## 5. Estrutura das Tabelas

### Tabela `images`
- Armazena as imagens geradas como BLOB
- Inclui metadados como tipo MIME e tamanho

### Tabela `generation_history`
- Armazena o histórico de gerações
- Inclui custos, tokens e configurações

### Tabela `history_images`
- Relaciona imagens com o histórico
- Permite múltiplas imagens por geração

### Tabela `system_config`
- Configurações do sistema
- Taxa de conversão USD/BRL

## 6. Vantagens do MySQL

✅ **Persistência**: Dados não são perdidos
✅ **Escalabilidade**: Suporta grandes volumes
✅ **Backup**: Fácil backup e restauração
✅ **Compatibilidade**: Funciona com hospedagem compartilhada
✅ **Performance**: Índices otimizados
✅ **Segurança**: Controle de acesso granular

## 7. Limitações de Hospedagem Compartilhada

⚠️ **Tamanho do banco**: Verifique limites do provedor
⚠️ **Conexões simultâneas**: Pode ter limitações
⚠️ **Timeout**: Ajuste conforme necessário
⚠️ **SSL**: Pode não estar disponível

## 8. Monitoramento

- Monitore o uso do banco de dados
- Configure limpeza automática de dados antigos
- Faça backups regulares
- Monitore performance das queries
