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

async function syncUserIds() {
  console.log('Sincronizando IDs dos usuários...');
  
  try {
    // Buscar usuários de autenticação
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Erro ao buscar usuários de auth:', authError.message);
      return;
    }

    // Buscar usuários da tabela users
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*');
    
    if (dbError) {
      console.error('Erro ao buscar usuários da tabela:', dbError.message);
      return;
    }

    console.log('\nMapeando usuários...');
    
    // Mapear emails para IDs de auth
    const emailToAuthId = {};
    authUsers.users.forEach(user => {
      emailToAuthId[user.email] = user.id;
      console.log(`Auth: ${user.email} -> ${user.id}`);
    });

    console.log('\nAtualizando IDs na tabela users...');
    
    for (const dbUser of dbUsers) {
      const authId = emailToAuthId[dbUser.email];
      if (authId && authId !== dbUser.id) {
        console.log(`Atualizando ${dbUser.email}: ${dbUser.id} -> ${authId}`);
        
        // Primeiro, vamos deletar o registro antigo
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', dbUser.id);
        
        if (deleteError) {
          console.error(`Erro ao deletar usuário ${dbUser.email}:`, deleteError.message);
          continue;
        }
        
        // Depois, inserir com o ID correto
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authId,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            department: dbUser.department,
            specialization: dbUser.specialization,
            created_at: dbUser.created_at,
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error(`Erro ao inserir usuário ${dbUser.email}:`, insertError.message);
        } else {
          console.log(`✅ Usuário ${dbUser.email} atualizado com sucesso`);
        }
      } else if (authId) {
        console.log(`✅ Usuário ${dbUser.email} já está correto`);
      } else {
        console.log(`⚠️  Usuário ${dbUser.email} não encontrado na autenticação`);
      }
    }
    
    console.log('\n🎉 Sincronização concluída!');
    
  } catch (error) {
    console.error('Erro inesperado:', error.message);
  }
}

syncUserIds().catch(console.error);