const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recreateProfessorsAuth() {
  try {
    console.log('🔄 Recriando autenticação dos professores...');
    
    // Dados dos professores da tabela users
    const professorsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'professor1@hidroginastica.com',
        password: 'professor123',
        name: 'João Santos'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        email: 'professor2@hidroginastica.com',
        password: 'professor123',
        name: 'Ana Costa'
      }
    ];
    
    // IDs dos usuários de auth que precisam ser removidos
    const authIdsToRemove = [
      '3e495290-9c2a-478e-8ad0-b4e8bf938930', // professor1 auth atual
      'afbd46fa-a3e5-42e7-81fc-b9e670b61b3f'  // professor2 auth atual
    ];
    
    // 1. Remover usuários de auth incorretos
    console.log('\n🗑️ Removendo usuários de auth incorretos...');
    for (const authId of authIdsToRemove) {
      console.log(`  🗑️ Removendo usuário de auth: ${authId}`);
      
      const { error } = await supabase.auth.admin.deleteUser(authId);
      
      if (error) {
        console.log(`  ⚠️ Aviso ao remover usuário ${authId}: ${error.message}`);
      } else {
        console.log(`  ✅ Usuário ${authId} removido com sucesso`);
      }
    }
    
    // 2. Criar novos usuários de auth com IDs corretos
    console.log('\n👤 Criando novos usuários de auth...');
    for (const prof of professorsData) {
      console.log(`  👤 Criando usuário: ${prof.email}`);
      
      const { data, error } = await supabase.auth.admin.createUser({
        user_id: prof.id, // Usar o ID da tabela users
        email: prof.email,
        password: prof.password,
        email_confirm: true,
        user_metadata: {
          name: prof.name
        }
      });
      
      if (error) {
        console.error(`  ❌ Erro ao criar usuário ${prof.email}:`, error);
      } else {
        console.log(`  ✅ Usuário ${prof.email} criado com ID: ${data.user.id}`);
      }
    }
    
    console.log('\n✅ Recriação dos professores concluída!');
    
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
    
  } catch (error) {
    console.error('❌ Erro durante a recriação:', error);
  }
}

recreateProfessorsAuth();