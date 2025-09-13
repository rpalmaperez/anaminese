# Configuração do Supabase Externo (Produção)

Este guia irá ajudá-lo a configurar o Supabase em produção (nuvem) ao invés do ambiente local.

## 📋 Pré-requisitos

- Conta no Supabase (https://supabase.com)
- Supabase CLI instalado (já temos)
- Acesso às migrações locais

## 🚀 Passo 1: Criar Projeto no Supabase Cloud

1. **Acesse o Supabase Dashboard:**
   - Vá para https://supabase.com/dashboard
   - Faça login ou crie uma conta

2. **Criar Novo Projeto:**
   - Clique em "New Project"
   - Escolha sua organização
   - Preencha os dados:
     - **Name**: `anaminese-app` (ou nome de sua preferência)
     - **Database Password**: Crie uma senha forte e **ANOTE**
     - **Region**: Escolha a região mais próxima (ex: South America)
   - Clique em "Create new project"

3. **Aguardar Provisionamento:**
   - O projeto levará alguns minutos para ser criado
   - Aguarde até aparecer "Project is ready"

## 🔑 Passo 2: Obter Credenciais do Projeto

Após o projeto ser criado:

1. **Acesse Settings > API:**
   - Vá para a aba "Settings" no menu lateral
   - Clique em "API"

2. **Copie as seguintes informações:**
   - **Project URL**: `https://[seu-projeto-id].supabase.co`
   - **anon/public key**: Chave pública para o frontend
   - **service_role key**: Chave privada para operações administrativas

## 🔧 Passo 3: Configurar Variáveis de Ambiente

Vamos atualizar o arquivo `.env.local` com as credenciais de produção:

```bash
# Supabase Configuration (PRODUÇÃO)
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[sua-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[sua-service-role-key]

# Manter outras configurações...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="Sistema de Anamnese - ARPA"
# ... resto das configurações
```

## 📊 Passo 4: Executar Migrações

Após configurar as variáveis de ambiente:

1. **Linkar projeto local com o remoto:**
   ```bash
   npx supabase link --project-ref [seu-projeto-id]
   ```

2. **Executar migrações:**
   ```bash
   npx supabase db push
   ```

3. **Verificar se as tabelas foram criadas:**
   - Acesse o Dashboard do Supabase
   - Vá para "Table Editor"
   - Verifique se as tabelas foram criadas corretamente

## 🔒 Passo 5: Configurar Row Level Security (RLS)

As políticas RLS já estão definidas nas migrações, mas verifique:

1. **Acesse SQL Editor no Dashboard**
2. **Execute para verificar RLS:**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

## ✅ Passo 6: Testar Conexão

Após configurar tudo:

1. **Reiniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Verificar logs do console:**
   - Não deve aparecer mais a mensagem de "usando dados mock"
   - A aplicação deve conectar com o Supabase real

3. **Testar funcionalidades:**
   - Login/Registro
   - Criação de estudantes
   - Criação de anamneses

## 🔧 Comandos Úteis

```bash
# Verificar status da conexão
npx supabase status

# Ver logs do projeto remoto
npx supabase logs

# Fazer backup do banco
npx supabase db dump --file backup.sql

# Resetar banco remoto (CUIDADO!)
npx supabase db reset --linked
```

## 🚨 Importante

- **NUNCA** commite as chaves de produção no Git
- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Mantenha backup regular dos dados
- Configure alertas de uso no Dashboard do Supabase

## 📞 Próximos Passos

Após configurar o Supabase externo:
1. Configure domínio personalizado (opcional)
2. Configure SSL/HTTPS para produção
3. Configure monitoramento e alertas
4. Configure backup automático

---

**Precisa de ajuda?** Consulte a [documentação oficial do Supabase](https://supabase.com/docs) ou abra uma issue no projeto.