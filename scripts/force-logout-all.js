const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceLogoutAll() {
  try {
    console.log('🔄 Forçando logout de todas as sessões...');
    
    // 1. Listar todos os usuários
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erro ao listar usuários:', authError);
      return;
    }
    
    console.log(`📋 Encontrados ${authUsers.users.length} usuários`);
    
    // 2. Invalidar sessões de cada usuário
    for (const user of authUsers.users) {
      console.log(`\n🔄 Invalidando sessões de ${user.email}...`);
      
      try {
        // Tentar invalidar todas as sessões do usuário
        const { error: signOutError } = await supabase.auth.admin.signOut(user.id, 'global');
        
        if (signOutError) {
          console.log(`⚠️ Aviso ao invalidar sessões de ${user.email}: ${signOutError.message}`);
        } else {
          console.log(`✅ Sessões de ${user.email} invalidadas`);
        }
      } catch (error) {
        console.log(`⚠️ Erro ao processar ${user.email}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Processo de logout forçado concluído!');
    console.log('\n💡 Instruções para testar:');
    console.log('1. Abra o DevTools do navegador (F12)');
    console.log('2. Vá para a aba Application/Storage');
    console.log('3. Limpe o localStorage e sessionStorage');
    console.log('4. Recarregue a página');
    console.log('5. Tente fazer login novamente');
    
    console.log('\n📝 Credenciais disponíveis:');
    console.log('• Admin: admin@hidroginastica.com / admin123');
    console.log('• Coordenador: coordenador@hidroginastica.com / coordenador123');
    console.log('• Professor 1: professor1@hidroginastica.com / professor123');
    console.log('• Professor 2: professor2@hidroginastica.com / professor123');
    
  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
  }
}

forceLogoutAll();