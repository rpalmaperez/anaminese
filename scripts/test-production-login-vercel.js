const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase para produção
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔗 Testando login no site de produção: https://anamnese-mu.vercel.app/login');
console.log('🔗 Conectando ao Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProductionLogin() {
  console.log('\n🧪 Testando login de produção...');
  
  // Lista de usuários para testar
  const testUsers = [
    { email: 'rpalmaperez@gmail.com', password: 'senha123', role: 'admin' },
    { email: 'digo_blaya@yahoo.com.br', password: 'senha123', role: 'admin' },
    { email: 'heloisahs51@gmail.com', password: 'senha123', role: 'professor' }
  ];

  for (const user of testUsers) {
    console.log(`\n👤 Testando usuário: ${user.email} (${user.role})`);
    
    try {
      // 1. Tentar fazer login
      console.log('1️⃣ Tentando fazer login...');
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (loginError) {
        console.error('❌ Erro no login:', loginError.message);
        
        // Verificar se o usuário existe
        console.log('🔍 Verificando se o usuário existe...');
        const { data: users, error: listError } = await supabase.auth.admin?.listUsers?.();
        
        if (!listError && users) {
          const userExists = users.users.find(u => u.email === user.email);
          if (userExists) {
            console.log('✅ Usuário existe na autenticação');
            console.log('📧 Email confirmado:', userExists.email_confirmed_at ? 'Sim' : 'Não');
          } else {
            console.log('❌ Usuário não encontrado na autenticação');
          }
        }
        continue;
      }

      console.log('✅ Login bem-sucedido!');
      console.log('🆔 User ID:', loginData.user.id);
      console.log('📧 Email:', loginData.user.email);
      console.log('✅ Email confirmado:', loginData.user.email_confirmed_at ? 'Sim' : 'Não');

      // 2. Buscar dados do perfil
      console.log('2️⃣ Buscando dados do perfil...');
      
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil encontrado!');
        console.log('👤 Nome:', profileData.name);
        console.log('🎭 Papel:', profileData.role);
        console.log('📅 Criado em:', new Date(profileData.created_at).toLocaleString('pt-BR'));
      }

      // 3. Testar acesso a dados (estudantes)
      console.log('3️⃣ Testando acesso a dados...');
      
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, email')
        .limit(5);

      if (studentsError) {
        console.error('❌ Erro ao acessar estudantes:', studentsError.message);
      } else {
        console.log(`✅ Acesso a estudantes: ${studentsData.length} registros encontrados`);
      }

      // 4. Fazer logout
      console.log('4️⃣ Fazendo logout...');
      await supabase.auth.signOut();
      console.log('✅ Logout realizado');

      console.log('\n🎉 TESTE COMPLETO PARA', user.email, '- SUCESSO!');

    } catch (error) {
      console.error('❌ Erro geral no teste:', error.message);
    }
  }

  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('🌐 Site de produção: https://anamnese-mu.vercel.app/login');
  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('📧 Usuários testados:', testUsers.length);
  
  console.log('\n💡 INSTRUÇÕES PARA TESTE MANUAL:');
  console.log('1. Acesse: https://anamnese-mu.vercel.app/login');
  console.log('2. Use as credenciais testadas acima');
  console.log('3. Verifique se o login funciona corretamente');
  console.log('4. Teste a navegação no dashboard');
}

testProductionLogin().catch(console.error);