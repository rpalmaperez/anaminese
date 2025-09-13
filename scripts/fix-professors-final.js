const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProfessorsIds() {
  try {
    console.log('🔄 Corrigindo IDs dos professores...');
    
    // Mapeamento dos professores
    const professorsMapping = [
      {
        email: 'professor1@hidroginastica.com',
        oldId: '550e8400-e29b-41d4-a716-446655440003',
        newId: '3e495290-9c2a-478e-8ad0-b4e8bf938930'
      },
      {
        email: 'professor2@hidroginastica.com',
        oldId: '550e8400-e29b-41d4-a716-446655440004',
        newId: 'afbd46fa-a3e5-42e7-81fc-b9e670b61b3f'
      }
    ];
    
    for (const prof of professorsMapping) {
      console.log(`\n🔄 Processando ${prof.email}...`);
      
      // 1. Primeiro, vamos remover temporariamente as restrições de chave estrangeira
      console.log('  📝 Desabilitando restrições de chave estrangeira...');
      
      // 2. Atualizar referências na tabela students
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
      
      // 3. Atualizar outras tabelas que possam referenciar o usuário
      const tablesToUpdate = ['anamneses', 'notifications', 'audit_logs'];
      
      for (const table of tablesToUpdate) {
        console.log(`  📝 Verificando tabela ${table}...`);
        
        // Tentar atualizar created_by
        const { error: createdByError } = await supabase
          .from(table)
          .update({ created_by: prof.newId })
          .eq('created_by', prof.oldId);
        
        if (createdByError && !createdByError.message.includes('column "created_by" of relation')) {
          console.log(`  ⚠️ Aviso ao atualizar created_by em ${table}: ${createdByError.message}`);
        }
        
        // Tentar atualizar user_id
        const { error: userIdError } = await supabase
          .from(table)
          .update({ user_id: prof.newId })
          .eq('user_id', prof.oldId);
        
        if (userIdError && !userIdError.message.includes('column "user_id" of relation')) {
          console.log(`  ⚠️ Aviso ao atualizar user_id em ${table}: ${userIdError.message}`);
        }
      }
      
      // 4. Finalmente, atualizar o ID na tabela users
      console.log('  📝 Atualizando ID na tabela users...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: prof.newId })
        .eq('id', prof.oldId);
      
      if (updateError) {
        console.error(`  ❌ Erro ao atualizar usuário ${prof.email}:`, updateError);
      } else {
        console.log(`  ✅ ID do usuário ${prof.email} atualizado com sucesso!`);
      }
    }
    
    console.log('\n✅ Correção de IDs dos professores concluída!');
    
    // Verificar o resultado final
    console.log('\n🔍 Verificando resultado final...');
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('email');
    
    if (error) {
      console.error('❌ Erro ao verificar usuários:', error);
    } else {
      console.log('\n📋 Usuários atualizados:');
      users.forEach(user => {
        console.log(`- ${user.email}: ${user.id} (${user.role})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

fixProfessorsIds();