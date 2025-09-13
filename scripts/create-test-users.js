const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando as credenciais locais)
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@hidroginastica.com',
    password: 'admin123',
    name: 'Administrador Sistema',
    role: 'admin'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'coordenador@hidroginastica.com',
    password: 'coord123',
    name: 'Maria Silva',
    role: 'coordenador'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'professor1@hidroginastica.com',
    password: 'prof123',
    name: 'João Santos',
    role: 'professor'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'professor2@hidroginastica.com',
    password: 'prof123',
    name: 'Ana Costa',
    role: 'professor'
  }
];

async function createTestUsers() {
  console.log('Criando usuários de teste...');
  
  for (const user of testUsers) {
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      });

      if (authError) {
        console.error(`Erro ao criar usuário ${user.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Usuário criado: ${user.email}`);
      
      // Atualizar o perfil do usuário na tabela users com o ID correto
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: authData.user.id })
        .eq('email', user.email);

      if (updateError) {
        console.error(`Erro ao atualizar perfil ${user.email}:`, updateError.message);
      } else {
        console.log(`✅ Perfil atualizado: ${user.email}`);
      }
      
    } catch (error) {
      console.error(`Erro inesperado para ${user.email}:`, error.message);
    }
  }
  
  console.log('\n🎉 Processo concluído!');
  console.log('\nCredenciais de teste:');
  testUsers.forEach(user => {
    console.log(`${user.role}: ${user.email} / ${user.password}`);
  });
}

createTestUsers().catch(console.error);