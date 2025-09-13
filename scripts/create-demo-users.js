const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Cliente admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const demoUsers = [
  {
    email: 'admin@demo.com',
    password: 'admin123',
    name: 'Administrador Demo',
    role: 'admin',
    department: 'Administração',
    specialization: 'Gestão'
  },
  {
    email: 'coordenador@demo.com',
    password: 'coord123',
    name: 'Coordenador Demo',
    role: 'coordenador',
    department: 'Educação Física',
    specialization: 'Hidroginástica'
  },
  {
    email: 'professor@demo.com',
    password: 'prof123',
    name: 'Professor Demo',
    role: 'professor',
    department: 'Educação Física',
    specialization: 'Hidroginástica'
  }
];

async function createDemoUsers() {
  try {
    console.log('🔄 Criando usuários de demonstração...');
    
    for (const user of demoUsers) {
      console.log(`\n👤 Criando usuário: ${user.email}`);
      
      // Verificar se já existe
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users.find(u => u.email === user.email);
      
      if (userExists) {
        console.log(`   ⚠️  Usuário ${user.email} já existe, pulando...`);
        continue;
      }
      
      // Criar usuário no auth com confirmação automática
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      });
      
      if (authError) {
        console.error(`   ❌ Erro ao criar usuário de auth:`, authError.message);
        continue;
      }
      
      console.log(`   ✅ Usuário de auth criado`);
      
      // Criar perfil na tabela users
      const { error: profileError } = await supabaseAdmin
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
        console.error(`   ❌ Erro ao criar perfil:`, profileError.message);
        // Tentar limpar o usuário de auth
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } else {
        console.log(`   ✅ Perfil criado na tabela users`);
        console.log(`   🔑 Credenciais: ${user.email} / ${user.password}`);
      }
    }
    
    console.log('\n🎉 Usuários de demonstração criados com sucesso!');
    
    console.log('\n📝 Credenciais para teste:');
    demoUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });
    
    console.log('\n💡 Agora você pode testar o login na interface web!');
    console.log('🌐 Acesse: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

createDemoUsers().catch(console.error);