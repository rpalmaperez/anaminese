const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Usar as configurações do .env.local com service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Conectando ao Supabase com Service Role:', supabaseUrl);

// Cliente com permissões administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente normal para auth
const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function createAdminUser() {
  console.log('\n👤 Criando usuário administrador...');
  
  const adminData = {
    email: 'admin@exemplo.com',
    password: 'admin123',
    name: 'Administrador Sistema',
    role: 'admin',
    phone: '(11) 99999-9999',
    department: 'Administração',
    specialization: 'Gestão do Sistema'
  };
  
  try {
    // 1. Verificar se o usuário já existe no Auth
    console.log('\n1️⃣ Verificando usuário existente...');
    
    const { data: loginTest, error: loginTestError } = await supabaseAuth.auth.signInWithPassword({
      email: adminData.email,
      password: adminData.password
    });
    
    let userId;
    
    if (loginTest && loginTest.user) {
      console.log('✅ Usuário já existe no Auth!');
      userId = loginTest.user.id;
      await supabaseAuth.auth.signOut();
    } else {
      console.log('\n📝 Usuário não encontrado, buscando por email...');
      
      // Buscar usuário por email usando Admin API
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Erro ao listar usuários:', listError.message);
        return;
      }
      
      const existingUser = users.users.find(u => u.email === adminData.email);
      
      if (existingUser) {
        console.log('✅ Usuário encontrado no Auth!');
        userId = existingUser.id;
        
        // Atualizar senha se necessário
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: adminData.password }
        );
        
        if (updateError) {
          console.log('⚠️ Não foi possível atualizar a senha:', updateError.message);
        } else {
          console.log('✅ Senha atualizada!');
        }
      } else {
        console.log('\n📝 Criando novo usuário no Auth...');
        
        // Criar usuário usando Admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: adminData.email,
          password: adminData.password,
          email_confirm: true, // Confirmar email automaticamente
          user_metadata: {
            name: adminData.name,
            role: adminData.role
          }
        });
        
        if (createError) {
          console.error('❌ Erro ao criar usuário:', createError.message);
          return;
        }
        
        console.log('✅ Usuário criado no Auth!');
        userId = newUser.user.id;
      }
    }
    
    console.log('User ID:', userId);
    
    // 2. Verificar se já existe na tabela users
    console.log('\n2️⃣ Verificando registro na tabela users...');
    
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (existingUser) {
      console.log('✅ Usuário já existe na tabela users!');
      console.table(existingUser);
    } else {
      console.log('\n📝 Criando registro na tabela users...');
      
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: adminData.email,
          name: adminData.name,
          role: adminData.role,
          phone: adminData.phone,
          department: adminData.department,
          specialization: adminData.specialization,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (userError) {
        console.error('❌ Erro ao criar usuário na tabela:', userError.message);
        console.error('Detalhes:', userError);
        return;
      }
      
      console.log('✅ Usuário criado na tabela users!');
      console.table(userData);
    }
    
    // 3. Testar login completo
    console.log('\n3️⃣ Testando login completo...');
    
    const { data: loginData, error: loginError } = await supabaseAuth.auth.signInWithPassword({
      email: adminData.email,
      password: adminData.password
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    
    // Buscar dados completos do usuário
    const { data: fullUserData, error: fetchError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar dados do usuário:', fetchError.message);
    } else {
      console.log('✅ Dados do usuário carregados!');
      console.table(fullUserData);
    }
    
    // Fazer logout
    await supabaseAuth.auth.signOut();
    
    console.log('\n🎉 USUÁRIO ADMINISTRADOR CRIADO COM SUCESSO!');
    console.log('\n📋 CREDENCIAIS PARA LOGIN:');
    console.log('Email:', adminData.email);
    console.log('Senha:', adminData.password);
    console.log('Função:', adminData.role);
    console.log('\n💡 Agora você pode fazer login na aplicação web!');
    console.log('🌐 Acesse: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

createAdminUser();