const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Cliente para teste de login
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Cliente admin para verificações
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

async function testLogin() {
  try {
    console.log('🔐 Testando login após confirmação de email...');
    
    // Primeiro, vamos verificar um usuário existente
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!users || users.users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }
    
    // Pegar o primeiro usuário confirmado
    const testUser = users.users.find(u => u.email_confirmed_at);
    
    if (!testUser) {
      console.log('❌ Nenhum usuário confirmado encontrado');
      return;
    }
    
    console.log(`📧 Testando login com: ${testUser.email}`);
    console.log(`✅ Status de confirmação: ${testUser.email_confirmed_at ? 'Confirmado' : 'Não confirmado'}`);
    
    // Tentar fazer login (vamos usar uma senha padrão que sabemos)
    // Como não sabemos a senha real, vamos criar um usuário de teste
    console.log('\n🔄 Criando usuário de teste para login...');
    
    const testEmail = `teste.login.${Date.now()}@gmail.com`;
    const testPassword = 'teste123';
    
    // Criar usuário com confirmação automática
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Usuário Teste Login'
      }
    });
    
    if (createError) {
      console.error('❌ Erro ao criar usuário de teste:', createError.message);
      return;
    }
    
    console.log(`✅ Usuário de teste criado: ${testEmail}`);
    
    // Criar perfil na tabela users
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email: testEmail,
        name: 'Usuário Teste Login',
        role: 'professor'
      });
    
    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError.message);
    } else {
      console.log('✅ Perfil criado na tabela users');
    }
    
    // Aguardar um pouco para garantir que tudo foi processado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Tentar fazer login
    console.log('\n🔐 Tentando fazer login...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      
      // Verificar se o usuário está realmente confirmado
      const { data: userCheck } = await supabaseAdmin.auth.admin.getUserById(newUser.user.id);
      console.log('📋 Status do usuário:');
      console.log(`   Email: ${userCheck.user?.email}`);
      console.log(`   Confirmado: ${userCheck.user?.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`   Data confirmação: ${userCheck.user?.email_confirmed_at}`);
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log(`👤 Usuário logado: ${loginData.user?.email}`);
      console.log(`🔑 Token válido: ${loginData.session ? 'Sim' : 'Não'}`);
      
      // Fazer logout
      await supabase.auth.signOut();
      console.log('🚪 Logout realizado');
    }
    
    // Limpar usuário de teste
    console.log('\n🧹 Limpando usuário de teste...');
    
    await supabaseAdmin.from('users').delete().eq('id', newUser.user.id);
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
    
    console.log('✅ Usuário de teste removido');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testLogin().catch(console.error);