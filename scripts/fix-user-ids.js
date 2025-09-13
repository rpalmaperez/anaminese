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

async function fixUserIds() {
  console.log('Corrigindo IDs dos usuários...');
  
  try {
    // Buscar usuários de autenticação
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao buscar usuários de auth:', authError.message);
      return;
    }
    
    // Mapear emails para IDs de autenticação
    const emailToAuthId = {};
    authUsers.users.forEach(user => {
      emailToAuthId[user.email] = user.id;
    });
    
    // Buscar usuários da tabela users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email');
    
    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    // Atualizar IDs dos usuários
    for (const user of users) {
      const authId = emailToAuthId[user.email];
      if (authId && authId !== user.id) {
        console.log(`Atualizando ${user.email}: ${user.id} -> ${authId}`);
        
        // Primeiro, vamos deletar o usuário antigo e inserir com o novo ID
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('email', user.email);
        
        if (deleteError) {
          console.error(`Erro ao deletar usuário ${user.email}:`, deleteError.message);
          continue;
        }
        
        // Buscar dados completos do usuário do seed
        const userData = {
          'coordenador@hidroginastica.com': {
            name: 'Maria Silva',
            role: 'coordenador',
            department: 'Educação Física',
            specialization: 'Hidroginástica'
          },
          'professor1@hidroginastica.com': {
            name: 'João Santos',
            role: 'professor',
            department: 'Educação Física',
            specialization: 'Hidroginástica'
          },
          'professor2@hidroginastica.com': {
            name: 'Ana Costa',
            role: 'professor',
            department: 'Educação Física',
            specialization: 'Natação'
          }
        };
        
        const userInfo = userData[user.email];
        if (userInfo) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authId,
              email: user.email,
              ...userInfo
            });
          
          if (insertError) {
            console.error(`Erro ao inserir usuário ${user.email}:`, insertError.message);
          } else {
            console.log(`✅ Usuário ${user.email} atualizado com sucesso`);
          }
        }
      }
    }
    
    console.log('\n🎉 Correção de IDs concluída!');
    
  } catch (error) {
    console.error('Erro inesperado:', error.message);
  }
}

fixUserIds().catch(console.error);