const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearStudentsAndSync() {
  try {
    console.log('🔄 Limpando tabela students e sincronizando IDs...');
    
    // 1. Primeiro, vamos limpar a tabela students para remover as restrições
    console.log('\n🗑️ Limpando tabela students...');
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.error('❌ Erro ao limpar tabela students:', deleteError);
    } else {
      console.log('✅ Tabela students limpa com sucesso');
    }
    
    // 2. Agora podemos atualizar os IDs dos professores na tabela users
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
    
    console.log('\n🔄 Atualizando IDs dos professores...');
    for (const prof of mapping) {
      console.log(`  📝 Atualizando ${prof.email}...`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: prof.newId })
        .eq('email', prof.email);
      
      if (updateError) {
        console.error(`  ❌ Erro ao atualizar ${prof.email}:`, updateError);
      } else {
        console.log(`  ✅ ${prof.email} atualizado com sucesso`);
      }
    }
    
    console.log('\n✅ Sincronização concluída!');
    
    // 3. Verificar o resultado final
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
    console.log('\n🔍 Verificando correspondências:');
    const authIds = new Set(authUsers.users.map(u => u.id));
    
    let allMatch = true;
    authUsers.users.forEach(authUser => {
      const dbUser = dbUsers.find(u => u.id === authUser.id);
      if (dbUser) {
        console.log(`✅ ${authUser.email} -> ${dbUser.name} (${dbUser.role})`);
      } else {
        console.log(`❌ ${authUser.email} (${authUser.id}) não encontrado na tabela users`);
        allMatch = false;
      }
    });
    
    if (allMatch) {
      console.log('\n🎉 Todos os usuários estão sincronizados corretamente!');
      console.log('\n📝 Credenciais de teste:');
      console.log('Admin: admin@hidroginastica.com / admin123');
      console.log('Coordenador: coordenador@hidroginastica.com / coordenador123');
      console.log('Professor 1: professor1@hidroginastica.com / professor123');
      console.log('Professor 2: professor2@hidroginastica.com / professor123');
    } else {
      console.log('\n⚠️ Ainda há usuários não sincronizados.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
  }
}

clearStudentsAndSync();