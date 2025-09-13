# Configuração do Supabase

Este guia explica como configurar o Supabase para o Sistema de Anamnese de Hidroginástica.

## Pré-requisitos

### 1. Docker Desktop
O Supabase local requer Docker Desktop para funcionar.

**Windows:**
1. Baixe o Docker Desktop em: https://docs.docker.com/desktop/install/windows-install/
2. Execute o instalador e siga as instruções
3. Reinicie o computador se necessário
4. Abra o Docker Desktop e aguarde a inicialização

**Verificar instalação:**
```bash
docker --version
```

### 2. Supabase CLI
O CLI já está instalado como dependência de desenvolvimento.

**Verificar instalação:**
```bash
npx supabase --version
```

## Configuração Local

### 1. Iniciar Supabase Local
```bash
npx supabase start
```

Este comando irá:
- Baixar e iniciar os containers Docker necessários
- Configurar PostgreSQL, PostgREST, GoTrue, Realtime, etc.
- Aplicar o schema do banco de dados automaticamente

### 2. Verificar Status
```bash
npx supabase status
```

Você deve ver algo como:
```
         API URL: http://localhost:54321
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
        Inbucket: http://localhost:54324
          anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Acessar Supabase Studio
Abra http://localhost:54323 no navegador para acessar o painel administrativo.

## Estrutura do Banco de Dados

O schema está definido em `supabase/schema.sql` e inclui:

### Tabelas Principais
- **users**: Usuários do sistema (professores, coordenadores, admins)
- **students**: Alunos cadastrados
- **anamneses**: Fichas de anamnese dos alunos
- **notifications**: Sistema de notificações
- **offline_actions**: Ações para sincronização offline
- **audit_logs**: Logs de auditoria

### Funcionalidades
- **Row Level Security (RLS)**: Políticas de segurança por linha
- **Triggers**: Atualizações automáticas e versionamento
- **Views**: Consultas otimizadas para relatórios
- **Functions**: Funções personalizadas para busca e sincronização
- **Storage**: Buckets para avatares, fotos e documentos

## Comandos Úteis

### Parar Supabase Local
```bash
npx supabase stop
```

### Resetar Banco de Dados
```bash
npx supabase db reset
```

### Aplicar Migrações
```bash
npx supabase db push
```

### Gerar Types TypeScript
```bash
npx supabase gen types typescript --local > src/types/database.ts
```

## Configuração de Produção

Para usar em produção:

1. Crie um projeto no [Supabase Cloud](https://supabase.com)
2. Atualize as variáveis de ambiente no `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
   ```
3. Execute as migrações:
   ```bash
   npx supabase db push --linked
   ```

## Troubleshooting

### Docker não encontrado
- Instale o Docker Desktop
- Certifique-se de que está rodando
- Reinicie o terminal após a instalação

### Porta já em uso
```bash
npx supabase stop
npx supabase start
```

### Erro de permissão
- Execute o Docker Desktop como administrador
- Verifique se o usuário está no grupo docker

### Schema não aplicado
```bash
npx supabase db reset
```

## Variáveis de Ambiente

O arquivo `.env.local` já está configurado com as chaves padrão do Supabase local:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

Essas são as chaves padrão do Supabase local e são seguras para desenvolvimento.