const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando as credenciais locais)
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  console.log('Verificando usuários na tabela users...');
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .order('email');

    if (error) {
      console.error('Erro ao buscar usuários:', error.message);
      return;
    }

    console.log('\nUsuários encontrados:');
    console.table(users);
    
    // Verificar usuários de autenticação
    console.log('\nVerificando usuários de autenticação...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao buscar usuários de auth:', authError.message);
      return;
    }
    
    console.log('\nUsuários de autenticação:');
    authUsers.users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email}`);
    });
    
  } catch (error) {
    console.error('Erro inesperado:', error.message);
  }
}

checkUsers().catch(console.error);