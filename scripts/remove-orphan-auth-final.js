const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeOrphanAuthFinal() {
  try {
    console.log('🧹 Removendo IDs órfãos do auth definitivamente...');
    
    // 1. Buscar usuários de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erro ao buscar usuários de auth:', authError);
      return;
    }

    // 2. Buscar usuários da tabela users
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email, role');
    
    if (dbError) {
      console.error('❌ Erro ao buscar usuários da tabela:', dbError);
      return;
    }

    console.log('\n📋 Estado atual:');
    console.log('Auth users:', authUsers.users.length);
    console.log('DB users:', dbUsers.length);

    // 3. Mapear IDs da tabela users por email
    const dbUsersByEmail = {};
    dbUsers.forEach(user => {
      dbUsersByEmail[user.email] = user;
    });

    // 4. Identificar e remover usuários órfãos no auth
    console.log('\n🔍 Verificando usuários de auth...');
    
    for (const authUser of authUsers.users) {
      const dbUser = dbUsersByEmail[authUser.email];
      
      if (!dbUser) {
        // Usuário existe no auth mas não na tabela - remover
        console.log(`🗑️ Removendo órfão do auth: ${authUser.email} (${authUser.id})`);
        
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
        
        if (deleteError) {
          console.error(`❌ Erro ao remover ${authUser.email}:`, deleteError);
        } else {
          console.log(`✅ ${authUser.email} removido do auth`);
        }
      } else if (authUser.id !== dbUser.id) {
        // IDs diferentes - remover o auth órfão
        console.log(`🔄 ID diferente para ${authUser.email}:`);
        console.log(`   Auth: ${authUser.id}`);
        console.log(`   DB:   ${dbUser.id}`);
        console.log(`🗑️ Removendo auth órfão...`);
        
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
        
        if (deleteError) {
          console.error(`❌ Erro ao remover auth órfão:`, deleteError);
        } else {
          console.log(`✅ Auth órfão removido`);
        }
      } else {
        console.log(`✅ ${authUser.email} sincronizado corretamente`);
      }
    }

    // 5. Criar usuários de auth para os que existem na tabela mas não no auth
    console.log('\n🔍 Verificando usuários que precisam de auth...');
    
    const { data: updatedAuthUsers } = await supabase.auth.admin.listUsers();
    const authEmails = new Set(updatedAuthUsers.users.map(u => u.email));
    
    const defaultPasswords = {
      admin: 'admin123',
      coordenador: 'coord123',
      professor: 'prof123'
    };

    for (const dbUser of dbUsers) {
      if (!authEmails.has(dbUser.email)) {
        const password = defaultPasswords[dbUser.role] || 'default123';
        
        console.log(`👤 Criando auth para ${dbUser.email} com ID ${dbUser.id}...`);
        
        // Tentar criar com o ID específico (pode não funcionar)
        const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
          email: dbUser.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            role: dbUser.role
          }
        });
        
        if (createError) {
          console.error(`❌ Erro ao criar auth para ${dbUser.email}:`, createError);
          continue;
        }
        
        console.log(`✅ Auth criado: ${newAuthUser.user.id}`);
        
        // Se o ID for diferente, atualizar na tabela users
        if (newAuthUser.user.id !== dbUser.id) {
          console.log(`🔄 Atualizando ID na tabela: ${dbUser.id} -> ${newAuthUser.user.id}`);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: newAuthUser.user.id })
            .eq('email', dbUser.email);
          
          if (updateError) {
            console.error(`❌ Erro ao atualizar ID:`, updateError);
          } else {
            console.log(`✅ ID atualizado na tabela users`);
          }
        }
      }
    }

    console.log('\n🎉 Limpeza final concluída!');
    
    // 6. Verificar resultado final
    console.log('\n🔍 Verificação final...');
    
    const { data: finalAuthUsers } = await supabase.auth.admin.listUsers();
    const { data: finalDbUsers } = await supabase
      .from('users')
      .select('email, id, role')
      .order('email');
    
    console.log('\n📋 Resultado final:');
    finalDbUsers?.forEach(user => {
      const authUser = finalAuthUsers?.users.find(au => au.email === user.email && au.id === user.id);
      const status = authUser ? '✅' : '❌';
      console.log(`${status} ${user.email}: ${user.id} (${user.role})`);
    });

    const perfectSync = finalDbUsers?.every(user => 
      finalAuthUsers?.users.some(au => au.email === user.email && au.id === user.id)
    );
    
    if (perfectSync) {
      console.log('\n🎉 PERFEITO! Todos os usuários estão perfeitamente sincronizados!');
      console.log('\n📝 Credenciais para login:');
      console.log('• Admin: admin@hidroginastica.com / admin123');
      console.log('• Coordenador: coordenador@hidroginastica.com / coord123');
      console.log('• Professor 1: professor1@hidroginastica.com / prof123');
      console.log('• Professor 2: professor2@hidroginastica.com / prof123');
      console.log('\n💡 Agora você pode fazer login normalmente!');
    } else {
      console.log('\n⚠️ Ainda há problemas de sincronização');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

removeOrphanAuthFinal();