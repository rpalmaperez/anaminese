const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanOrphanAuth() {
  try {
    console.log('🧹 Limpando usuários órfãos do auth...');
    
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

    // 3. Identificar usuários órfãos no auth
    const dbEmails = new Set(dbUsers.map(u => u.email));
    const orphanAuthUsers = authUsers.users.filter(authUser => {
      return !dbEmails.has(authUser.email);
    });

    console.log('\n🔍 Usuários órfãos no auth (serão removidos):');
    orphanAuthUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.id}`);
    });

    // 4. Remover usuários órfãos do auth
    for (const orphanUser of orphanAuthUsers) {
      console.log(`\n🗑️ Removendo ${orphanUser.email} do auth...`);
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(orphanUser.id);
      
      if (deleteError) {
        console.error(`❌ Erro ao remover ${orphanUser.email}:`, deleteError);
      } else {
        console.log(`✅ ${orphanUser.email} removido do auth`);
      }
    }

    // 5. Criar usuários de auth para os que existem na tabela mas não no auth
    const authEmails = new Set(authUsers.users.map(u => u.email));
    const missingAuthUsers = dbUsers.filter(dbUser => {
      return !authEmails.has(dbUser.email);
    });

    console.log('\n🔍 Usuários que precisam ser criados no auth:');
    missingAuthUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.id} (${user.role})`);
    });

    // Definir senhas padrão por role
    const defaultPasswords = {
      admin: 'admin123',
      coordenador: 'coord123',
      professor: 'prof123'
    };

    for (const dbUser of missingAuthUsers) {
      const password = defaultPasswords[dbUser.role] || 'default123';
      
      console.log(`\n👤 Criando auth para ${dbUser.email}...`);
      
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
      
      console.log(`✅ Auth criado para ${dbUser.email}: ${newAuthUser.user.id}`);
      
      // Atualizar o ID na tabela users
      console.log(`🔄 Atualizando ID na tabela users...`);
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: newAuthUser.user.id })
        .eq('email', dbUser.email);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar ID:`, updateError);
      } else {
        console.log(`✅ ID atualizado: ${dbUser.id} -> ${newAuthUser.user.id}`);
      }
    }

    console.log('\n🎉 Limpeza concluída!');
    
    // 6. Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    
    const { data: finalAuthUsers } = await supabase.auth.admin.listUsers();
    const { data: finalDbUsers } = await supabase
      .from('users')
      .select('email, id, role')
      .order('email');
    
    console.log('\n📋 Usuários finais:');
    finalDbUsers?.forEach(user => {
      const authUser = finalAuthUsers?.users.find(au => au.email === user.email);
      const status = authUser ? '✅' : '❌';
      console.log(`${status} ${user.email}: ${user.id} (${user.role})`);
    });

    console.log('\n📝 Credenciais para login:');
    console.log('• Admin: admin@hidroginastica.com / admin123');
    console.log('• Coordenador: coordenador@hidroginastica.com / coord123');
    console.log('• Professor 1: professor1@hidroginastica.com / prof123');
    console.log('• Professor 2: professor2@hidroginastica.com / prof123');
    
    const syncedCount = finalDbUsers?.filter(user => 
      finalAuthUsers?.users.some(au => au.email === user.email)
    ).length || 0;
    
    if (syncedCount === finalDbUsers?.length) {
      console.log('\n🎉 Perfeito! Todos os usuários estão sincronizados!');
    } else {
      console.log(`\n⚠️ ${syncedCount}/${finalDbUsers?.length} usuários sincronizados`);
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

cleanOrphanAuth();