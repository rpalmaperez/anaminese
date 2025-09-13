const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncFinal() {
  try {
    console.log('🔄 Sincronização final dos IDs...');
    
    // Mapeamento dos novos IDs
    const mapping = [
      {
        email: 'professor1@hidroginastica.com',
        oldId: '550e8400-e29b-41d4-a716-446655440003',
        newId: '40209292-c9ae-4b0a-b15e-1ad45e2ab050'
      },
      {
        email: 'professor2@hidroginastica.com',
        oldId: '550e8400-e29b-41d4-a716-446655440004',
        newId: '8859aeb3-6c4a-4f84-afed-357160837ef8'
      }
    ];
    
    for (const prof of mapping) {
      console.log(`\n🔄 Sincronizando ${prof.email}...`);
      
      // 1. Atualizar referências na tabela students
      console.log('  📝 Atualizando referências na tabela students...');
      const { error: studentsError } = await supabase
        .from('students')
        .update({ created_by: prof.newId })
        .eq('created_by', prof.oldId);
      
      if (studentsError) {
        console.log(`  ⚠️ Aviso ao atualizar students: ${studentsError.message}`);
      } else {
        console.log('  ✅ Referências em students atualizadas');
      }
      
      // 2. Atualizar outras possíveis referências
      const tablesToCheck = ['anamneses'];
      
      for (const table of tablesToCheck) {
        console.log(`  📝 Verificando tabela ${table}...`);
        
        const { error: updateError } = await supabase
          .from(table)
          .update({ created_by: prof.newId })
          .eq('created_by', prof.oldId);
        
        if (updateError && !updateError.message.includes('column "created_by" of relation')) {
          console.log(`  ⚠️ Aviso ao atualizar ${table}: ${updateError.message}`);
        }
      }
      
      // 3. Finalmente, atualizar o ID na tabela users
      console.log('  📝 Atualizando ID na tabela users...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: prof.newId })
        .eq('email', prof.email); // Usar email como referência
      
      if (updateError) {
        console.error(`  ❌ Erro ao atualizar usuário ${prof.email}:`, updateError);
      } else {
        console.log(`  ✅ ID do usuário ${prof.email} atualizado com sucesso!`);
      }
    }
    
    console.log('\n✅ Sincronização final concluída!');
    
    // Verificar o resultado final
    console.log('\n🔍 Verificando resultado final...');
    
    // Listar usuários de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erro ao listar usuários de auth:', authError);
    } else {
      console.log('\n📋 Usuários de autenticação:');
      authUsers.users.forEach(user => {
        console.log(`- ${user.email}: ${user.id}`);
      });
    }
    
    // Listar usuários da tabela
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .order('email');
    
    if (dbError) {
      console.error('❌ Erro ao listar usuários da tabela:', dbError);
    } else {
      console.log('\n📋 Usuários na tabela users:');
      dbUsers.forEach(user => {
        console.log(`- ${user.email}: ${user.id} (${user.role})`);
      });
    }
    
    // Verificar correspondências
    console.log('\n🔍 Verificando correspondências finais:');
    const authIds = new Set(authUsers.users.map(u => u.id));
    const dbIds = new Set(dbUsers.map(u => u.id));
    
    let allMatch = true;
    authUsers.users.forEach(authUser => {
      if (dbIds.has(authUser.id)) {
        const dbUser = dbUsers.find(u => u.id === authUser.id);
        console.log(`✅ ${authUser.email} -> ${dbUser.name} (${dbUser.role})`);
      } else {
        console.log(`❌ ${authUser.email} (${authUser.id}) não encontrado na tabela users`);
        allMatch = false;
      }
    });
    
    if (allMatch) {
      console.log('\n🎉 Todos os usuários estão sincronizados corretamente!');
    } else {
      console.log('\n⚠️ Ainda há usuários não sincronizados.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a sincronização:', error);
  }
}

syncFinal();