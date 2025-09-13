const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCurrentSession() {
  try {
    console.log('🔍 Debugando sessões ativas...');
    
    // 1. Listar todas as sessões ativas
    console.log('\n📋 Verificando sessões no banco de dados...');
    
    // Verificar se existe uma tabela de sessões
    const { data: sessions, error: sessionsError } = await supabase
      .from('auth.sessions')
      .select('*')
      .limit(10);
    
    if (sessionsError) {
      console.log('⚠️ Não foi possível acessar tabela de sessões:', sessionsError.message);
    } else {
      console.log('📊 Sessões encontradas:', sessions?.length || 0);
      if (sessions && sessions.length > 0) {
        sessions.forEach(session => {
          console.log(`- Usuário: ${session.user_id}, Criada: ${session.created_at}`);
        });
      }
    }
    
    // 2. Listar usuários de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erro ao listar usuários de auth:', authError);
      return;
    }
    
    console.log('\n📋 Usuários de autenticação:');
    authUsers.users.forEach(user => {
      console.log(`- ${user.email}: ${user.id}`);
    });
    
    // 3. Listar usuários da tabela users
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .order('email');
    
    if (dbError) {
      console.error('❌ Erro ao listar usuários da tabela:', dbError);
      return;
    }
    
    console.log('\n📋 Usuários na tabela users:');
    dbUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.id} (${user.role})`);
    });
    
    // 4. Verificar se há IDs órfãos
    console.log('\n🔍 Verificando IDs órfãos...');
    
    const authIds = authUsers.users.map(u => u.id);
    const dbIds = dbUsers.map(u => u.id);
    
    const orphanAuthIds = authIds.filter(id => !dbIds.includes(id));
    const orphanDbIds = dbIds.filter(id => !authIds.includes(id));
    
    if (orphanAuthIds.length > 0) {
      console.log('⚠️ IDs de auth sem correspondência na tabela users:');
      orphanAuthIds.forEach(id => {
        const user = authUsers.users.find(u => u.id === id);
        console.log(`- ${user?.email}: ${id}`);
      });
    }
    
    if (orphanDbIds.length > 0) {
      console.log('⚠️ IDs na tabela users sem correspondência no auth:');
      orphanDbIds.forEach(id => {
        const user = dbUsers.find(u => u.id === id);
        console.log(`- ${user?.email}: ${id}`);
      });
    }
    
    if (orphanAuthIds.length === 0 && orphanDbIds.length === 0) {
      console.log('✅ Todos os IDs estão sincronizados!');
    }
    
    // 5. Tentar fazer uma consulta como o frontend faria
    console.log('\n🧪 Testando consultas como o frontend...');
    
    for (const authUser of authUsers.users) {
      console.log(`\n🔍 Testando busca para ${authUser.email} (${authUser.id})...`);
      
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (profileError) {
        console.log(`❌ Erro: ${profileError.message}`);
        console.log(`   Código: ${profileError.code}`);
        console.log(`   Detalhes: ${profileError.details}`);
      } else {
        console.log(`✅ Perfil encontrado: ${profileData.name} (${profileData.role})`);
      }
    }
    
    console.log('\n💡 Próximos passos sugeridos:');
    console.log('1. Se há IDs órfãos, eles precisam ser removidos ou sincronizados');
    console.log('2. Limpe o localStorage do navegador (F12 > Application > Storage)');
    console.log('3. Tente fazer login novamente');
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

debugCurrentSession();