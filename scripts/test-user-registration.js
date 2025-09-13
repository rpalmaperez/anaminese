const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase usando variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'Não definida');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Definida' : 'Não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUserRegistration() {
  console.log('🧪 Testando criação de usuário...');
  
  const testUser = {
    email: `teste.usuario.${Date.now()}@gmail.com`,
    password: 'test123456',
    name: 'Usuário Teste',
    role: 'professor',
    department: 'Educação Física',
    specialization: 'Hidroginástica'
  };
  
  try {
    console.log('\n1️⃣ Criando usuário de autenticação...');
    
    // Criar usuário no auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
    });
    
    if (authError) {
      console.error('❌ Erro na autenticação:', authError.message);
      return;
    }
    
    console.log('✅ Usuário de auth criado:', authData.user?.id);
    
    if (authData.user) {
      console.log('\n2️⃣ Criando perfil do usuário...');
      
      // Criar perfil na tabela users
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
          phone: null,
          department: testUser.department,
          specialization: testUser.specialization,
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError);
        console.log('Detalhes do erro:');
        console.log('- Código:', profileError.code);
        console.log('- Mensagem:', profileError.message);
        console.log('- Detalhes:', profileError.details);
        console.log('- Hint:', profileError.hint);
        
        // Tentar limpar o usuário de auth criado
        console.log('\n🧹 Limpando usuário de auth...');
        const { error: deleteError } = await supabase.auth.admin.deleteUser(authData.user.id);
        if (deleteError) {
          console.error('❌ Erro ao limpar usuário:', deleteError.message);
        } else {
          console.log('✅ Usuário de auth removido');
        }
        
        return;
      }
      
      console.log('✅ Perfil criado com sucesso:', profileData);
      
      // Verificar se o usuário foi criado corretamente
      console.log('\n3️⃣ Verificando usuário criado...');
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (fetchError) {
        console.error('❌ Erro ao buscar usuário:', fetchError.message);
      } else {
        console.log('✅ Usuário encontrado:', userData);
      }
      
      // Limpar dados de teste
      console.log('\n🧹 Limpando dados de teste...');
      
      // Remover perfil
      const { error: deleteProfileError } = await supabase
        .from('users')
        .delete()
        .eq('id', authData.user.id);
      
      if (deleteProfileError) {
        console.error('❌ Erro ao remover perfil:', deleteProfileError.message);
      } else {
        console.log('✅ Perfil removido');
      }
      
      // Remover usuário de auth
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authData.user.id);
      if (deleteAuthError) {
        console.error('❌ Erro ao remover usuário de auth:', deleteAuthError.message);
      } else {
        console.log('✅ Usuário de auth removido');
      }
    }
    
    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Função para verificar estrutura da tabela users
async function checkUsersTable() {
  console.log('\n🔍 Verificando estrutura da tabela users...');
  
  try {
    // Tentar fazer uma consulta simples
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela users:', error);
      return false;
    }
    
    console.log('✅ Tabela users acessível');
    console.log('Exemplo de registro:', data?.[0] || 'Nenhum registro encontrado');
    return true;
    
  } catch (error) {
    console.error('❌ Erro inesperado ao verificar tabela:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico de registro de usuário...');
  
  // Verificar tabela primeiro
  const tableOk = await checkUsersTable();
  
  if (tableOk) {
    // Executar teste de registro
    await testUserRegistration();
  } else {
    console.log('❌ Não é possível continuar - problema com a tabela users');
  }
}

main().catch(console.error);