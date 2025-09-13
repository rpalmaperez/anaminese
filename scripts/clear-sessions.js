const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAllSessions() {
  try {
    console.log('🔄 Limpando todas as sessões...');
    
    // Listar todos os usuários de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários:', authError);
      return;
    }
    
    console.log(`📋 Encontrados ${authUsers.users.length} usuários de auth`);
    
    // Invalidar sessões de todos os usuários
    for (const user of authUsers.users) {
      console.log(`🔄 Invalidando sessões do usuário: ${user.email}`);
      
      const { error } = await supabase.auth.admin.signOut(user.id, 'global');
      
      if (error) {
        console.error(`❌ Erro ao invalidar sessões de ${user.email}:`, error);
      } else {
        console.log(`✅ Sessões invalidadas para ${user.email}`);
      }
    }
    
    console.log('✅ Limpeza de sessões concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  }
}

clearAllSessions();