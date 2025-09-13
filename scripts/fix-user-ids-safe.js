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

async function fixUserIdsSafe() {
  console.log('Corrigindo IDs dos usuários de forma segura...');
  
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
    
    // Mapeamento de IDs antigos para novos
    const idMapping = {
      '550e8400-e29b-41d4-a716-446655440003': emailToAuthId['professor1@hidroginastica.com'],
      '550e8400-e29b-41d4-a716-446655440004': emailToAuthId['professor2@hidroginastica.com']
    };
    
    // Atualizar referências na tabela students
    console.log('Atualizando referências na tabela students...');
    for (const [oldId, newId] of Object.entries(idMapping)) {
      if (newId) {
        const { error: updateError } = await supabase
          .from('students')
          .update({ created_by: newId })
          .eq('created_by', oldId);
        
        if (updateError) {
          console.error(`Erro ao atualizar students para ${oldId}:`, updateError.message);
        } else {
          console.log(`✅ Referências de students atualizadas: ${oldId} -> ${newId}`);
        }
      }
    }
    
    // Atualizar referências na tabela notifications se existir
    console.log('Atualizando referências na tabela notifications...');
    for (const [oldId, newId] of Object.entries(idMapping)) {
      if (newId) {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ user_id: newId })
          .eq('user_id', oldId);
        
        if (updateError && !updateError.message.includes('relation "notifications" does not exist')) {
          console.error(`Erro ao atualizar notifications para ${oldId}:`, updateError.message);
        } else if (!updateError.message?.includes('relation "notifications" does not exist')) {
          console.log(`✅ Referências de notifications atualizadas: ${oldId} -> ${newId}`);
        }
      }
    }
    
    // Agora atualizar os IDs na tabela users
    console.log('Atualizando IDs na tabela users...');
    
    const usersToUpdate = [
      {
        email: 'professor1@hidroginastica.com',
        oldId: '550e8400-e29b-41d4-a716-446655440003',
        newId: emailToAuthId['professor1@hidroginastica.com'],
        name: 'João Santos',
        role: 'professor',
        department: 'Educação Física',
        specialization: 'Hidroginástica'
      },
      {
        email: 'professor2@hidroginastica.com',
        oldId: '550e8400-e29b-41d4-a716-446655440004',
        newId: emailToAuthId['professor2@hidroginastica.com'],
        name: 'Ana Costa',
        role: 'professor',
        department: 'Educação Física',
        specialization: 'Natação'
      }
    ];
    
    for (const user of usersToUpdate) {
      if (user.newId) {
        // Deletar usuário antigo
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', user.oldId);
        
        if (deleteError) {
          console.error(`Erro ao deletar usuário ${user.email}:`, deleteError.message);
          continue;
        }
        
        // Inserir usuário com novo ID
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.newId,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
            specialization: user.specialization
          });
        
        if (insertError) {
          console.error(`Erro ao inserir usuário ${user.email}:`, insertError.message);
        } else {
          console.log(`✅ Usuário ${user.email} atualizado com sucesso`);
        }
      }
    }
    
    console.log('\n🎉 Correção de IDs concluída com segurança!');
    
  } catch (error) {
    console.error('Erro inesperado:', error.message);
  }
}

fixUserIdsSafe().catch(console.error);