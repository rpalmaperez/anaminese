const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Usar as configurações do .env.local (produção)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔗 Conectando ao Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  console.log('\n👤 Criando usuário de teste...');
  
  const testUserData = {
    email: 'admin@exemplo.com',
    password: 'admin123',
    name: 'Administrador Teste',
    role: 'admin',
    phone: '(11) 99999-9999',
    department: 'Hidroginástica',
    specialization: 'Fisioterapia Aquática'
  };
  
  try {
    console.log('\n1️⃣ Tentando registrar usuário...');
    console.log('Email:', testUserData.email);
    console.log('Senha:', testUserData.password);
    
    // 1. Registrar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUserData.email,
      password: testUserData.password,
      options: {
        data: {
          name: testUserData.name,
          role: testUserData.role
        }
      }
    });
    
    if (authError) {
      console.error('❌ Erro no registro Auth:', authError.message);
      
      // Se o usuário já existe, tentar fazer login
      if (authError.message.includes('already registered')) {
        console.log('\n🔄 Usuário já existe, tentando fazer login...');
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testUserData.email,
          password: testUserData.password
        });
        
        if (loginError) {
          console.error('❌ Erro no login:', loginError.message);
          return;
        }
        
        console.log('✅ Login bem-sucedido!');
        console.log('User ID:', loginData.user.id);
        console.log('Email:', loginData.user.email);
        
        // Verificar se o usuário existe na tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', loginData.user.id)
          .single();
        
        if (userError && userError.code === 'PGRST116') {
          console.log('\n2️⃣ Usuário não existe na tabela users, criando...');
          
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id: loginData.user.id,
              email: testUserData.email,
              name: testUserData.name,
              role: testUserData.role,
              phone: testUserData.phone,
              department: testUserData.department,
              specialization: testUserData.specialization
            })
            .select()
            .single();
          
          if (insertError) {
            console.error('❌ Erro ao criar usuário na tabela:', insertError.message);
            return;
          }
          
          console.log('✅ Usuário criado na tabela users!');
          console.table(newUser);
        } else if (userData) {
          console.log('✅ Usuário já existe na tabela users!');
          console.table(userData);
        }
        
        await supabase.auth.signOut();
        return;
      }
      
      return;
    }
    
    console.log('✅ Usuário registrado no Auth!');
    console.log('User ID:', authData.user.id);
    
    // 2. Criar registro na tabela users
    console.log('\n2️⃣ Criando registro na tabela users...');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: testUserData.email,
        name: testUserData.name,
        role: testUserData.role,
        phone: testUserData.phone,
        department: testUserData.department,
        specialization: testUserData.specialization
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Erro ao criar usuário na tabela:', userError.message);
      return;
    }
    
    console.log('✅ Usuário criado com sucesso!');
    console.table(userData);
    
    // 3. Testar login
    console.log('\n3️⃣ Testando login...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUserData.email,
      password: testUserData.password
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      return;
    }
    
    console.log('✅ Login teste bem-sucedido!');
    console.log('User ID:', loginData.user.id);
    console.log('Email:', loginData.user.email);
    
    // Fazer logout
    await supabase.auth.signOut();
    
    console.log('\n🎉 USUÁRIO DE TESTE CRIADO COM SUCESSO!');
    console.log('\n📋 CREDENCIAIS PARA LOGIN:');
    console.log('Email:', testUserData.email);
    console.log('Senha:', testUserData.password);
    console.log('\n💡 Agora você pode fazer login na aplicação web!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createTestUser();