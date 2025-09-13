const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAuthSync() {
  try {
    console.log('🔄 Corrigindo sincronização de autenticação...');
    
    // 1. Buscar usuários de auth atuais
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erro ao buscar usuários de auth:', authError);
      return;
    }

    // 2. Buscar usuários da tabela
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*');
    if (dbError) {
      console.error('❌ Erro ao buscar usuários da tabela:', dbError);
      return;
    }

    // 3. Mapear emails para novos IDs de auth
    const emailToNewId = {};
    authUsers.users.forEach(user => {
      emailToNewId[user.email] = user.id;
    });

    console.log('\n📋 Mapeamento de IDs:');
    Object.entries(emailToNewId).forEach(([email, id]) => {
      console.log(`${email} -> ${id}`);
    });

    // 4. Atualizar referências na tabela students primeiro
    console.log('\n🔄 Atualizando referências na tabela students...');
    for (const dbUser of dbUsers) {
      const newId = emailToNewId[dbUser.email];
      if (newId && newId !== dbUser.id) {
        console.log(`Atualizando students de ${dbUser.email}: ${dbUser.id} -> ${newId}`);
        
        const { error: updateError } = await supabase
          .from('students')
          .update({ created_by: newId })
          .eq('created_by', dbUser.id);
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar students:`, updateError);
        } else {
          console.log(`✅ Students atualizados para ${dbUser.email}`);
        }
      }
    }

    // 5. Atualizar referências na tabela notifications
    console.log('\n🔄 Atualizando referências na tabela notifications...');
    for (const dbUser of dbUsers) {
      const newId = emailToNewId[dbUser.email];
      if (newId && newId !== dbUser.id) {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ user_id: newId })
          .eq('user_id', dbUser.id);
        
        if (updateError) {
          console.log(`⚠️ Aviso ao atualizar notifications para ${dbUser.email}:`, updateError.message);
        } else {
          console.log(`✅ Notifications atualizadas para ${dbUser.email}`);
        }
      }
    }

    // 6. Agora atualizar a tabela users
    console.log('\n🔄 Atualizando tabela users...');
    for (const dbUser of dbUsers) {
      const newId = emailToNewId[dbUser.email];
      if (newId && newId !== dbUser.id) {
        console.log(`Atualizando usuário ${dbUser.email}: ${dbUser.id} -> ${newId}`);
        
        // Deletar usuário antigo
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', dbUser.id);
        
        if (deleteError) {
          console.error(`❌ Erro ao deletar usuário ${dbUser.email}:`, deleteError);
          continue;
        }
        
        // Inserir usuário com novo ID
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: newId,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            department: dbUser.department,
            specialization: dbUser.specialization
          });
        
        if (insertError) {
          console.error(`❌ Erro ao inserir usuário ${dbUser.email}:`, insertError);
        } else {
          console.log(`✅ Usuário ${dbUser.email} atualizado com sucesso`);
        }
      }
    }

    console.log('\n🎉 Sincronização concluída!');
    
    // 7. Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    const { data: finalCheck } = await supabase
      .from('users')
      .select('email, id, role');
    
    console.log('\n📋 Usuários finais:');
    finalCheck?.forEach(user => {
      console.log(`- ${user.email}: ${user.id} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

fixAuthSync();