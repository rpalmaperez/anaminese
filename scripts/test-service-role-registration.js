const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase usando service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Não definida');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Definida' : 'Não definida');
  process.exit(1);
}

// Cliente com service role (bypassa RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cliente anônimo (para testar auth)
const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testServiceRoleRegistration() {
  console.log('🧪 Testando registro com service role...');
  
  const testUser = {
    email: `teste.service.${Date.now()}@gmail.com`,
    password: 'test123456',
    name: 'Usuário Service Teste',
    role: 'professor',
    department: 'Educação Física',
    specialization: 'Hidroginástica'
  };
  
  try {
    console.log('\n1️⃣ Criando usuário de auth com service role...');
    
    // Criar usuário usando service role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        name: testUser.name
      }
    });
    
    if (authError) {
      console.error('❌ Erro na criação do auth:', authError);
      return;
    }
    
    console.log('✅ Usuário de auth criado:', authData.user.id);
    
    console.log('\n2️⃣ Criando perfil com service role...');
    
    // Criar perfil usando service role
    const profileData = {
      id: authData.user.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
      department: testUser.department,
      specialization: testUser.specialization,
    };
    
    const { data: profileResult, error: profileError } = await supabaseAdmin
      .from('users')
      .insert(profileData)
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao criar perfil com service role:', profileError);
    } else {
      console.log('✅ Perfil criado com service role:', profileResult);
    }
    
    console.log('\n3️⃣ Testando acesso com usuário anônimo...');
    
    // Tentar fazer login com o usuário criado
    const { data: loginData, error: loginError } = await supabaseAnon.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError);
    } else {
      console.log('✅ Login bem-sucedido:', loginData.user.id);
      
      // Tentar acessar o perfil
      const { data: userProfile, error: profileFetchError } = await supabaseAnon
        .from('users')
        .select('*')
        .eq('id', loginData.user.id)
        .single();
      
      if (profileFetchError) {
        console.error('❌ Erro ao buscar perfil:', profileFetchError);
      } else {
        console.log('✅ Perfil acessado:', userProfile);
      }
      
      // Fazer logout
      await supabaseAnon.auth.signOut();
      console.log('✅ Logout realizado');
    }
    
    console.log('\n🧹 Limpando dados de teste...');
    
    // Limpar perfil
    const { error: deleteProfileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', authData.user.id);
    
    if (deleteProfileError) {
      console.error('❌ Erro ao limpar perfil:', deleteProfileError);
    } else {
      console.log('✅ Perfil removido');
    }
    
    // Limpar usuário de auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    
    if (deleteAuthError) {
      console.error('❌ Erro ao limpar auth:', deleteAuthError);
    } else {
      console.log('✅ Usuário de auth removido');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

async function testDirectInsert() {
  console.log('\n🔧 Testando inserção direta com diferentes clientes...');
  
  const testProfile = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'teste.direto@example.com',
    name: 'Teste Direto',
    role: 'professor'
  };
  
  console.log('\n📝 Teste 1: Inserção com service role...');
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(testProfile)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro com service role:', error);
    } else {
      console.log('✅ Sucesso com service role:', data);
      
      // Limpar
      await supabaseAdmin.from('users').delete().eq('id', testProfile.id);
      console.log('✅ Limpeza realizada');
    }
  } catch (err) {
    console.error('❌ Erro inesperado com service role:', err);
  }
  
  console.log('\n📝 Teste 2: Inserção com cliente anônimo...');
  try {
    const { data, error } = await supabaseAnon
      .from('users')
      .insert(testProfile)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro com cliente anônimo (esperado):', error.message);
    } else {
      console.log('⚠️ Sucesso inesperado com cliente anônimo:', data);
      
      // Limpar
      await supabaseAdmin.from('users').delete().eq('id', testProfile.id);
    }
  } catch (err) {
    console.error('❌ Erro inesperado com cliente anônimo:', err);
  }
}

async function main() {
  console.log('🚀 Iniciando teste com service role...');
  console.log('URL do Supabase:', supabaseUrl);
  console.log('Service key:', supabaseServiceKey ? 'Definida' : 'Não definida');
  
  await testDirectInsert();
  await testServiceRoleRegistration();
}

main().catch(console.error);