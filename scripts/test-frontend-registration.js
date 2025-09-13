const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase usando as mesmas configurações do frontend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Não definida');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Definida' : 'Não definida');
  process.exit(1);
}

// Usar a mesma configuração que o frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simular a função translateSupabaseError do AuthContext
const translateSupabaseError = (errorMessage) => {
  const translations = {
    'Invalid login credentials': 'Credenciais de login inválidas',
    'Email not confirmed': 'E-mail não confirmado',
    'User already registered': 'Usuário já cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Unable to validate email address: invalid format': 'Formato de e-mail inválido',
    'Email rate limit exceeded': 'Limite de tentativas de e-mail excedido',
  };
  
  return translations[errorMessage] || errorMessage;
};

// Simular exatamente a função signUp do AuthContext
async function simulateSignUp(email, password, userData) {
  try {
    console.log('🔄 Iniciando processo de registro...');
    console.log('Email:', email);
    console.log('Dados do usuário:', userData);
    
    // Create auth user (exatamente como no AuthContext)
    console.log('\n1️⃣ Criando usuário de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Erro na autenticação:', authError);
      return { error: translateSupabaseError(authError.message) };
    }

    console.log('✅ Usuário de auth criado:', authData.user?.id);
    console.log('Dados completos do auth:', authData);

    if (authData.user) {
      console.log('\n2️⃣ Criando perfil do usuário...');
      
      // Create user profile (exatamente como no AuthContext)
      const profileData = {
        id: authData.user.id,
        email,
        name: userData.name || '',
        role: userData.role || 'professor',
        phone: userData.phone,
        department: userData.department,
        specialization: userData.specialization,
      };
      
      console.log('Dados do perfil a serem inseridos:', profileData);
      
      const { data: insertedData, error: profileError } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError);
        console.log('Código do erro:', profileError.code);
        console.log('Mensagem:', profileError.message);
        console.log('Detalhes:', profileError.details);
        console.log('Hint:', profileError.hint);
        
        // Tentar limpar o usuário de auth criado
        console.log('\n🧹 Tentando limpar usuário de auth...');
        try {
          await supabase.auth.signOut();
          console.log('✅ Logout realizado');
        } catch (cleanupError) {
          console.error('❌ Erro no cleanup:', cleanupError);
        }
        
        return { error: 'Erro ao criar perfil do usuário' };
      }
      
      console.log('✅ Perfil criado com sucesso:', insertedData);
    }

    return {};
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return { error: 'Erro inesperado ao criar conta' };
  }
}

async function testFrontendRegistration() {
  console.log('🧪 Testando registro como no frontend...');
  
  const testUser = {
    email: `teste.frontend.${Date.now()}@gmail.com`,
    password: 'test123456',
    name: 'Usuário Frontend Teste',
    role: 'professor',
    department: 'Educação Física',
    specialization: 'Hidroginástica'
  };
  
  console.log('\n📋 Dados do teste:');
  console.log('- Email:', testUser.email);
  console.log('- Senha:', testUser.password);
  console.log('- Nome:', testUser.name);
  console.log('- Role:', testUser.role);
  
  const result = await simulateSignUp(
    testUser.email, 
    testUser.password, 
    {
      name: testUser.name,
      role: testUser.role,
      phone: undefined,
      department: testUser.department,
      specialization: testUser.specialization,
    }
  );
  
  if (result.error) {
    console.error('\n❌ ERRO NO REGISTRO:', result.error);
  } else {
    console.log('\n✅ REGISTRO BEM-SUCEDIDO!');
    
    // Verificar se o usuário foi criado
    console.log('\n🔍 Verificando usuário criado...');
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testUser.email)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar usuário:', fetchError);
    } else {
      console.log('✅ Usuário encontrado:', userData);
      
      // Limpar dados de teste
      console.log('\n🧹 Limpando dados de teste...');
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', userData.id);
      
      if (deleteError) {
        console.error('❌ Erro ao limpar:', deleteError);
      } else {
        console.log('✅ Dados limpos');
      }
    }
  }
}

// Teste com diferentes cenários
async function testDifferentScenarios() {
  console.log('\n🎯 Testando diferentes cenários...');
  
  // Cenário 1: Email inválido
  console.log('\n📧 Teste 1: Email inválido');
  const result1 = await simulateSignUp('email-invalido', 'test123456', {
    name: 'Teste',
    role: 'professor'
  });
  console.log('Resultado:', result1.error || 'Sucesso inesperado');
  
  // Cenário 2: Senha muito curta
  console.log('\n🔒 Teste 2: Senha muito curta');
  const result2 = await simulateSignUp('teste@gmail.com', '123', {
    name: 'Teste',
    role: 'professor'
  });
  console.log('Resultado:', result2.error || 'Sucesso inesperado');
  
  // Cenário 3: Dados válidos
  console.log('\n✅ Teste 3: Dados válidos');
  await testFrontendRegistration();
}

async function main() {
  console.log('🚀 Iniciando teste de registro frontend...');
  console.log('URL do Supabase:', supabaseUrl);
  console.log('Chave anônima:', supabaseAnonKey ? 'Definida' : 'Não definida');
  
  await testDifferentScenarios();
}

main().catch(console.error);