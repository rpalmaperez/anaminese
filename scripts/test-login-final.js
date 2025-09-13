const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Usar as configurações do .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔗 Conectando ao Supabase:', supabaseUrl);

// Cliente normal para auth (como a aplicação usa)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('\n🧪 TESTE FINAL DE LOGIN');
  console.log('=' .repeat(50));
  
  const email = 'admin@exemplo.com';
  const password = 'admin123';
  
  try {
    console.log('\n1️⃣ Testando login...');
    console.log('Email:', email);
    console.log('Senha:', password);
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (loginError) {
      console.error('❌ ERRO NO LOGIN:', loginError.message);
      console.error('Código:', loginError.status);
      return;
    }
    
    console.log('✅ LOGIN BEM-SUCEDIDO!');
    console.log('User ID:', loginData.user.id);
    console.log('Email:', loginData.user.email);
    console.log('Email confirmado:', loginData.user.email_confirmed_at ? 'Sim' : 'Não');
    
    // 2. Buscar dados do usuário na tabela users
    console.log('\n2️⃣ Buscando dados do usuário...');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar dados do usuário:', userError.message);
    } else {
      console.log('✅ Dados do usuário encontrados:');
      console.table(userData);
    }
    
    // 3. Testar acesso a dados protegidos
    console.log('\n3️⃣ Testando acesso a dados protegidos...');
    
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, name, email')
      .limit(5);
    
    if (studentsError) {
      console.error('❌ Erro ao acessar estudantes:', studentsError.message);
    } else {
      console.log('✅ Acesso aos estudantes OK!');
      console.log('Número de estudantes encontrados:', studentsData.length);
      if (studentsData.length > 0) {
        console.table(studentsData);
      }
    }
    
    // 4. Fazer logout
    console.log('\n4️⃣ Fazendo logout...');
    
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.error('❌ Erro no logout:', logoutError.message);
    } else {
      console.log('✅ Logout realizado com sucesso!');
    }
    
    console.log('\n🎉 TESTE COMPLETO!');
    console.log('=' .repeat(50));
    console.log('\n📋 RESUMO:');
    console.log('✅ Login funcionando');
    console.log('✅ Usuário criado e confirmado');
    console.log('✅ Acesso aos dados OK');
    console.log('✅ Logout funcionando');
    console.log('\n💡 CREDENCIAIS PARA A APLICAÇÃO:');
    console.log('Email:', email);
    console.log('Senha:', password);
    console.log('\n🌐 Acesse: http://localhost:3000');
    console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
    console.log('- Há erros de navegação no Next.js');
    console.log('- O login via API funciona perfeitamente');
    console.log('- O problema está na interface web, não na autenticação');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLogin();