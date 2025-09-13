const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simpleAuthFix() {
  try {
    console.log('🔧 Correção simples: manter IDs da tabela users, recriar auth...');
    
    // 1. Buscar todos os usuários da tabela users
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .order('email');
    
    if (dbError) {
      console.error('❌ Erro ao buscar usuários da tabela:', dbError);
      return;
    }

    console.log('\n📋 Usuários na tabela users:');
    dbUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.id} (${user.role})`);
    });

    // 2. Buscar usuários de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erro ao buscar usuários de auth:', authError);
      return;
    }

    console.log('\n📋 Usuários no auth:');
    authUsers.users.forEach(user => {
      console.log(`- ${user.email}: ${user.id}`);
    });

    // 3. Identificar usuários órfãos no auth (que não correspondem aos IDs da tabela)
    const dbUsersByEmail = {};
    dbUsers.forEach(user => {
      dbUsersByEmail[user.email] = user;
    });

    const orphanAuthUsers = authUsers.users.filter(authUser => {
      const dbUser = dbUsersByEmail[authUser.email];
      return !dbUser || authUser.id !== dbUser.id;
    });

    console.log('\n🗑️ Removendo usuários órfãos do auth...');
    for (const orphanUser of orphanAuthUsers) {
      console.log(`   Removendo ${orphanUser.email} (${orphanUser.id})`);
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(orphanUser.id);
      
      if (deleteError) {
        console.error(`   ❌ Erro ao remover:`, deleteError);
      } else {
        console.log(`   ✅ Removido`);
      }
    }

    // 4. Buscar auth atualizado
    const { data: updatedAuthUsers } = await supabase.auth.admin.listUsers();
    const authEmails = new Set(updatedAuthUsers.users.map(u => u.email));

    // 5. Criar usuários de auth para os que faltam
    const defaultPasswords = {
      admin: 'admin123',
      coordenador: 'coord123',
      professor: 'prof123'
    };

    console.log('\n👤 Criando usuários de auth faltantes...');
    
    for (const dbUser of dbUsers) {
      if (!authEmails.has(dbUser.email)) {
        const password = defaultPasswords[dbUser.role] || 'default123';
        
        console.log(`   Criando auth para ${dbUser.email}...`);
        
        // Tentar criar com ID específico usando admin API
        try {
          // Primeiro, tentar criar o usuário normalmente
          const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
            email: dbUser.email,
            password: password,
            email_confirm: true,
            user_metadata: {
              role: dbUser.role,
              name: dbUser.name
            }
          });
          
          if (createError) {
            console.error(`   ❌ Erro ao criar:`, createError);
            continue;
          }
          
          console.log(`   ✅ Criado com ID: ${newAuthUser.user.id}`);
          
          // Se o ID for diferente do esperado, atualizar a tabela users
          if (newAuthUser.user.id !== dbUser.id) {
            console.log(`   🔄 Atualizando ID na tabela: ${dbUser.id} -> ${newAuthUser.user.id}`);
            
            // Primeiro, atualizar todas as referências
            const referenceTables = [
              { table: 'students', column: 'created_by' },
              { table: 'notifications', column: 'user_id' },
              { table: 'anamneses', column: 'created_by' }
            ];
            
            for (const { table, column } of referenceTables) {
              const { error: refError } = await supabase
                .from(table)
                .update({ [column]: newAuthUser.user.id })
                .eq(column, dbUser.id);
              
              if (refError && !refError.message.includes('Could not find')) {
                console.log(`     ⚠️ Aviso em ${table}:`, refError.message);
              }
            }
            
            // Depois, atualizar o ID na tabela users
            const { error: updateError } = await supabase
              .from('users')
              .update({ id: newAuthUser.user.id })
              .eq('email', dbUser.email);
            
            if (updateError) {
              console.error(`   ❌ Erro ao atualizar ID:`, updateError);
            } else {
              console.log(`   ✅ ID atualizado na tabela users`);
            }
          }
          
        } catch (error) {
          console.error(`   ❌ Erro inesperado:`, error);
        }
      } else {
        console.log(`   ✅ ${dbUser.email} já existe no auth`);
      }
    }

    console.log('\n🎉 Correção concluída!');
    
    // 6. Verificação final
    console.log('\n🔍 Verificação final...');
    
    const { data: finalAuthUsers } = await supabase.auth.admin.listUsers();
    const { data: finalDbUsers } = await supabase
      .from('users')
      .select('email, id, role')
      .order('email');
    
    console.log('\n📋 Estado final:');
    let syncedCount = 0;
    finalDbUsers?.forEach(user => {
      const authUser = finalAuthUsers?.users.find(au => au.email === user.email && au.id === user.id);
      const status = authUser ? '✅' : '❌';
      if (authUser) syncedCount++;
      console.log(`${status} ${user.email}: ${user.id} (${user.role})`);
    });

    if (syncedCount === finalDbUsers?.length) {
      console.log('\n🎉 SUCESSO! Todos os usuários estão sincronizados!');
      console.log('\n📝 Credenciais para login:');
      console.log('• Admin: admin@hidroginastica.com / admin123');
      console.log('• Coordenador: coordenador@hidroginastica.com / coord123');
      console.log('• Professor 1: professor1@hidroginastica.com / prof123');
      console.log('• Professor 2: professor2@hidroginastica.com / prof123');
      console.log('\n💡 Seu usuário foi restaurado! Agora você pode fazer login normalmente.');
      console.log('\n🧹 Lembre-se de limpar o localStorage do navegador (F12 > Application > Storage)');
    } else {
      console.log(`\n⚠️ ${syncedCount}/${finalDbUsers?.length} usuários sincronizados`);
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

simpleAuthFix();