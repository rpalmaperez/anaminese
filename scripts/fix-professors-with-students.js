const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfessorsWithStudents() {
  try {
    console.log('🔧 Corrigindo professores que têm estudantes associados...');
    
    // 1. Buscar usuários de auth atuais
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erro ao buscar usuários de auth:', authError);
      return;
    }

    // 2. Buscar professores da tabela users
    const { data: professors, error: profError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('role', 'professor');
    
    if (profError) {
      console.error('❌ Erro ao buscar professores:', profError);
      return;
    }

    console.log('\n📋 Professores encontrados:');
    professors.forEach(prof => {
      console.log(`- ${prof.email}: ${prof.id}`);
    });

    // 3. Mapear novos IDs de auth por email
    const newAuthIds = {};
    authUsers.users.forEach(user => {
      if (user.email.includes('professor')) {
        newAuthIds[user.email] = user.id;
      }
    });

    console.log('\n📋 Novos IDs de auth:');
    Object.entries(newAuthIds).forEach(([email, id]) => {
      console.log(`- ${email}: ${id}`);
    });

    // 4. Para cada professor, fazer a correção
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

      console.log(`\n🔄 Corrigindo ${prof.email}...`);
      console.log(`   Antigo ID: ${prof.id}`);
      console.log(`   Novo ID:   ${newAuthId}`);

      // 4.1. Verificar quantos estudantes estão associados
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .eq('created_by', prof.id);

      if (studentsError) {
        console.error(`❌ Erro ao buscar estudantes:`, studentsError);
        continue;
      }

      console.log(`   📚 ${students.length} estudantes associados`);
      if (students.length > 0) {
        students.forEach(student => {
          console.log(`     - ${student.name} (${student.id})`);
        });
      }

      // 4.2. Atualizar referências dos estudantes PRIMEIRO
      if (students.length > 0) {
        console.log(`   🔄 Atualizando referências dos estudantes...`);
        
        const { error: updateStudentsError } = await supabase
          .from('students')
          .update({ created_by: newAuthId })
          .eq('created_by', prof.id);

        if (updateStudentsError) {
          console.error(`   ❌ Erro ao atualizar estudantes:`, updateStudentsError);
          continue;
        }
        
        console.log(`   ✅ Referências dos estudantes atualizadas`);
      }

      // 4.3. Verificar outras tabelas que podem referenciar o professor
      const tablesToCheck = ['notifications', 'anamneses', 'audit_logs'];
      
      for (const table of tablesToCheck) {
        console.log(`   🔍 Verificando tabela ${table}...`);
        
        // Tentar atualizar created_by
        const { error: updateError1 } = await supabase
          .from(table)
          .update({ created_by: newAuthId })
          .eq('created_by', prof.id);
        
        if (updateError1 && !updateError1.message.includes('Could not find')) {
          console.log(`   ⚠️ Aviso em ${table}.created_by:`, updateError1.message);
        }
        
        // Tentar atualizar user_id
        const { error: updateError2 } = await supabase
          .from(table)
          .update({ user_id: newAuthId })
          .eq('user_id', prof.id);
        
        if (updateError2 && !updateError2.message.includes('Could not find')) {
          console.log(`   ⚠️ Aviso em ${table}.user_id:`, updateError2.message);
        }
      }

      // 4.4. Agora atualizar o ID na tabela users
      console.log(`   🔄 Atualizando ID na tabela users...`);
      
      const { error: updateUserError } = await supabase
        .from('users')
        .update({ id: newAuthId })
        .eq('email', prof.email);

      if (updateUserError) {
        console.error(`   ❌ Erro ao atualizar usuário:`, updateUserError);
      } else {
        console.log(`   ✅ ID do usuário atualizado com sucesso!`);
      }

      console.log(`✅ ${prof.email} corrigido!`);
    }

    console.log('\n🎉 Correção concluída!');
    
    // 5. Verificar resultado final
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
      console.log('\n🧹 Lembre-se de limpar o localStorage do navegador (F12 > Application > Storage)');
    } else {
      console.log('\n⚠️ Ainda há problemas de sincronização');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

fixProfessorsWithStudents();