const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfessors() {
  console.log('Corrigindo IDs dos professores...');
  
  try {
    // Buscar usuários de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    
    // Mapear por email
    const authMap = {};
    authUsers.users.forEach(user => {
      authMap[user.email] = user.id;
    });
    
    // Atualizar professor1
    const prof1AuthId = authMap['professor1@hidroginastica.com'];
    if (prof1AuthId) {
      const { error: updateError1 } = await supabase
        .from('users')
        .update({ id: prof1AuthId })
        .eq('email', 'professor1@hidroginastica.com');
      
      if (updateError1) {
        console.log('Erro ao atualizar professor1:', updateError1.message);
      } else {
        console.log('✅ Professor1 atualizado com sucesso');
      }
    }
    
    // Atualizar professor2
    const prof2AuthId = authMap['professor2@hidroginastica.com'];
    if (prof2AuthId) {
      const { error: updateError2 } = await supabase
        .from('users')
        .update({ id: prof2AuthId })
        .eq('email', 'professor2@hidroginastica.com');
      
      if (updateError2) {
        console.log('Erro ao atualizar professor2:', updateError2.message);
      } else {
        console.log('✅ Professor2 atualizado com sucesso');
      }
    }
    
    console.log('🎉 Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

fixProfessors();