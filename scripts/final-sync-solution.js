const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finalSyncSolution() {
  try {
    console.log('🔧 Solução final para sincronização de usuários...');
    
    // 1. Buscar usuários de auth atuais
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erro ao buscar usuários de auth:', authError);
      return;
    }

    // 2. Buscar professores da tabela users
    const { data: professors, error: profError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'professor');
    
    if (profError) {
      console.error('❌ Erro ao buscar professores:', profError);
      return;
    }

    console.log('\n📋 Professores a corrigir:');
    professors.forEach(prof => {
      console.log(`- ${prof.email}: ${prof.id} (${prof.name})`);
    });

    // 3. Mapear novos IDs de auth por email
    const newAuthIds = {};
    authUsers.users.forEach(user => {
      if (user.email.includes('professor')) {
        newAuthIds[user.email] = user.id;
      }
    });

    console.log('\n📋 Novos IDs de auth disponíveis:');
    Object.entries(newAuthIds).forEach(([email, id]) => {
      console.log(`- ${email}: ${id}`);
    });

    // 4. Para cada professor, fazer a correção completa
    for (const prof of professors) {
      const newAuthId = newAuthIds[prof.email];
      
      if (!newAuthId) {
        console.log(`⚠️ Pulando ${prof.email} - não encontrado no auth`);
        continue;
      }

      if (prof.id === newAuthId) {
        console.log(`✅ ${prof.email} já está sincronizado`);
        continue;
      }

      console.log(`\n🔄 Processando ${prof.email}...`);
      console.log(`   Antigo ID: ${prof.id}`);
      console.log(`   Novo ID:   ${newAuthId}`);

      // 4.1. Primeiro, inserir o novo usuário na tabela users
      console.log(`   📝 Inserindo novo usuário...`);
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: newAuthId,
          email: prof.email,
          name: prof.name,
          role: prof.role,
          department: prof.department,
          specialization: prof.specialization,
          created_at: prof.created_at,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`   ❌ Erro ao inserir novo usuário:`, insertError);
        continue;
      }
      
      console.log(`   ✅ Novo usuário inserido`);

      // 4.2. Atualizar referências dos estudantes
      console.log(`   🔄 Atualizando referências dos estudantes...`);
      
      const { error: updateStudentsError } = await supabase
        .from('students')
        .update({ created_by: newAuthId })
        .eq('created_by', prof.id);

      if (updateStudentsError) {
        console.error(`   ❌ Erro ao atualizar estudantes:`, updateStudentsError);
      } else {
        console.log(`   ✅ Referências dos estudantes atualizadas`);
      }

      // 4.3. Atualizar outras referências
      const tablesToUpdate = [
        { table: 'notifications', column: 'user_id' },
        { table: 'anamneses', column: 'created_by' },
        { table: 'audit_logs', column: 'created_by' }
      ];
      
      for (const { table, column } of tablesToUpdate) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ [column]: newAuthId })
          .eq(column, prof.id);
        
        if (updateError && !updateError.message.includes('Could not find')) {
          console.log(`   ⚠️ Aviso em ${table}.${column}:`, updateError.message);
        }
      }

      // 4.4. Remover o usuário antigo
      console.log(`   🗑️ Removendo usuário antigo...`);
      
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', prof.id);

      if (deleteError) {
        console.error(`   ❌ Erro ao remover usuário antigo:`, deleteError);
      } else {
        console.log(`   ✅ Usuário antigo removido`);
      }

      console.log(`✅ ${prof.email} sincronizado com sucesso!`);
    }

    console.log('\n🎉 Sincronização final concluída!');
    
    // 5. Verificar resultado final
    console.log('\n🔍 Verificação final...');
    
    const { data: finalAuthUsers } = await supabase.auth.admin.listUsers();
    const { data: finalDbUsers } = await supabase
      .from('users')
      .select('email, id, role')
      .order('email');
    
    console.log('\n📋 Estado final:');
    finalDbUsers?.forEach(user => {
      const authUser = finalAuthUsers?.users.find(au => au.email === user.email && au.id === user.id);
      const status = authUser ? '✅' : '❌';
      console.log(`${status} ${user.email}: ${user.id} (${user.role})`);
    });

    // 6. Verificar se há IDs órfãos
    const authIds = new Set(finalAuthUsers?.users.map(u => u.id) || []);
    const dbIds = new Set(finalDbUsers?.map(u => u.id) || []);
    
    const orphanAuth = finalAuthUsers?.users.filter(u => !dbIds.has(u.id)) || [];
    const orphanDb = finalDbUsers?.filter(u => !authIds.has(u.id)) || [];
    
    if (orphanAuth.length === 0 && orphanDb.length === 0) {
      console.log('\n🎉 PERFEITO! Sincronização 100% completa!');
      console.log('\n📝 Credenciais para login:');
      console.log('• Admin: admin@hidroginastica.com / admin123');
      console.log('• Coordenador: coordenador@hidroginastica.com / coord123');
      console.log('• Professor 1: professor1@hidroginastica.com / prof123');
      console.log('• Professor 2: professor2@hidroginastica.com / prof123');
      console.log('\n💡 Agora você pode fazer login normalmente!');
      console.log('\n🧹 Lembre-se de:');
      console.log('   1. Limpar o localStorage do navegador (F12 > Application > Storage)');
      console.log('   2. Fazer logout/login se já estiver logado');
    } else {
      console.log('\n⚠️ Ainda há inconsistências:');
      if (orphanAuth.length > 0) {
        console.log('Auth órfãos:', orphanAuth.map(u => `${u.email} (${u.id})`));
      }
      if (orphanDb.length > 0) {
        console.log('DB órfãos:', orphanDb.map(u => `${u.email} (${u.id})`));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

finalSyncSolution();