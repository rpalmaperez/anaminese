const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase (usando as credenciais de produção)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não encontradas no .env.local');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  console.log('🔍 Verificando usuários na tabela users...');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      return;
    }

    console.log(`\n📊 Total de usuários encontrados: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Usuários cadastrados:');
      console.table(users.map(user => ({
        ID: user.id.substring(0, 8) + '...',
        Email: user.email,
        Nome: user.name,
        Papel: user.role,
        'Criado em': new Date(user.created_at).toLocaleString('pt-BR')
      })));
      
      // Estatísticas por papel
      const roleStats = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Estatísticas por papel:');
      Object.entries(roleStats).forEach(([role, count]) => {
        console.log(`  ${role}: ${count} usuário(s)`);
      });
    } else {
      console.log('⚠️ Nenhum usuário encontrado na tabela users');
    }
    
    // Verificar usuários de autenticação
    console.log('\n🔐 Verificando usuários de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao buscar usuários de auth:', authError.message);
      return;
    }
    
    console.log(`\n📊 Total de usuários de autenticação: ${authData.users.length}`);
    
    if (authData.users.length > 0) {
      console.log('\n🔑 Usuários de autenticação:');
      authData.users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id.substring(0, 8)}... | Email: ${user.email} | Confirmado: ${user.email_confirmed_at ? '✅' : '❌'}`);
      });
    }
    
    // Verificar sincronização
    const authEmails = new Set(authData.users.map(u => u.email));
    const userEmails = new Set(users.map(u => u.email));
    
    const onlyInAuth = [...authEmails].filter(email => !userEmails.has(email));
    const onlyInUsers = [...userEmails].filter(email => !authEmails.has(email));
    
    if (onlyInAuth.length > 0 || onlyInUsers.length > 0) {
      console.log('\n⚠️ Problemas de sincronização detectados:');
      if (onlyInAuth.length > 0) {
        console.log('📧 Usuários apenas na autenticação:', onlyInAuth);
      }
      if (onlyInUsers.length > 0) {
        console.log('👤 Usuários apenas na tabela users:', onlyInUsers);
      }
    } else {
      console.log('\n✅ Usuários sincronizados corretamente entre auth e tabela users');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

checkUsers().catch(console.error);