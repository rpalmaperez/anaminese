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
    email: 'admin@hidroginastica.com',
    password: 'admin123',
    name: 'Administrador Sistema',
    role: 'admin',
    department: 'Administração',
    specialization: 'Gestão'
  },
  {
    email: 'coordenador@hidroginastica.com',
    password: 'coord123',
    name: 'Maria Silva',
    role: 'coordenador',
    department: 'Educação Física',
    specialization: 'Hidroginástica'
  },
  {
    email: 'professor1@hidroginastica.com',
    password: 'prof123',
    name: 'João Santos',
    role: 'professor',
    department: 'Educação Física',
    specialization: 'Hidroginástica'
  },
  {
    email: 'professor2@hidroginastica.com',
    password: 'prof123',
    name: 'Ana Costa',
    role: 'professor',
    department: 'Educação Física',
    specialization: 'Natação'
  }
];

async function createUsersSimple() {
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

      console.log(`✅ Usuário de auth criado: ${user.email}`);
      
      // Criar perfil do usuário na tabela users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          specialization: user.specialization
        });

      if (profileError) {
        console.error(`Erro ao criar perfil ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Perfil criado: ${user.email}`);
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

createUsersSimple().catch(console.error);