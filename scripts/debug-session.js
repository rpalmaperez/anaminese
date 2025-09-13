const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

async function debugSession() {
  try {
    console.log('🔍 Verificando sessões ativas...');
    
    // Listar todos os usuários de auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários de auth:', authError);
      return;
    }
    
    console.log('\n📋 Usuários de autenticação:');
    authUsers.users.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Criado em: ${user.created_at}`);
      console.log(`  Último login: ${user.last_sign_in_at || 'Nunca'}`);
      console.log('');
    });
    
    // Listar todos os usuários da tabela users
    const { data: dbUsers, error: dbError } = await supabaseClient
      .from('users')
      .select('*');
    
    if (dbError) {
      console.error('❌ Erro ao buscar usuários da tabela:', dbError);
      return;
    }
    
    console.log('\n📋 Usuários na tabela users:');
    dbUsers.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Nome: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log('');
    });
    
    // Verificar correspondências
    console.log('\n🔍 Verificando correspondências:');
    const authIds = new Set(authUsers.users.map(u => u.id));
    const dbIds = new Set(dbUsers.map(u => u.id));
    
    console.log('\n❌ IDs de auth sem correspondência na tabela users:');
    authUsers.users.forEach(authUser => {
      if (!dbIds.has(authUser.id)) {
        console.log(`- ${authUser.id} (${authUser.email})`);
      }
    });
    
    console.log('\n❌ IDs na tabela users sem correspondência no auth:');
    dbUsers.forEach(dbUser => {
      if (!authIds.has(dbUser.id)) {
        console.log(`- ${dbUser.id} (${dbUser.email})`);
      }
    });
    
    console.log('\n✅ Correspondências corretas:');
    authUsers.users.forEach(authUser => {
      if (dbIds.has(authUser.id)) {
        const dbUser = dbUsers.find(u => u.id === authUser.id);
        console.log(`- ${authUser.id} (${authUser.email}) -> ${dbUser.name} (${dbUser.role})`);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
}

debugSession();