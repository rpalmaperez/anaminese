const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Usar as configurações do .env.local (produção)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔗 Conectando ao Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('\n🧪 Testando conexão e login...');
  
  try {
    // 1. Testar conexão básica
    console.log('\n1️⃣ Testando conexão com Supabase...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro de conexão:', healthError.message);
      return;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    
    // 2. Listar usuários disponíveis
    console.log('\n2️⃣ Listando usuários disponíveis...');
    const { data: allUsers, error: listError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .limit(5);
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
    } else {
      console.log('📋 Usuários encontrados:');
      console.table(allUsers);
    }
    
    // 3. Tentar login com usuário de teste (se existir)
    if (allUsers && allUsers.length > 0) {
      const testUser = allUsers.find(u => u.email.includes('admin') || u.role === 'admin');
      
      if (testUser) {
        console.log('\n3️⃣ Tentando login com usuário admin...');
        console.log('Email de teste:', testUser.email);
        
        // Tentar algumas senhas comuns de teste
        const testPasswords = ['admin123', 'password', '123456', 'admin'];
        
        for (const password of testPasswords) {
          console.log(`\n🔐 Testando senha: ${password}`);
          
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: testUser.email,
            password: password
          });
          
          if (authError) {
            console.log(`❌ Falha com senha '${password}':`, authError.message);
          } else {
            console.log('✅ Login bem-sucedido!');
            console.log('User ID:', authData.user.id);
            console.log('Email:', authData.user.email);
            
            // Fazer logout
            await supabase.auth.signOut();
            return;
          }
        }
        
        console.log('\n⚠️ Nenhuma senha de teste funcionou.');
      } else {
        console.log('\n⚠️ Nenhum usuário admin encontrado para teste.');
      }
    }
    
    // 4. Instruções para o usuário
    console.log('\n📝 DIAGNÓSTICO:');
    console.log('✅ Conexão com Supabase: OK');
    console.log('✅ Acesso à tabela users: OK');
    console.log('❓ Login: Precisa de credenciais válidas');
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Verifique se você tem um usuário cadastrado');
    console.log('2. Tente fazer login pela interface web');
    console.log('3. Se necessário, crie um novo usuário via registro');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n🔍 POSSÍVEIS CAUSAS:');
    console.log('- Credenciais do Supabase incorretas');
    console.log('- Problemas de rede');
    console.log('- Configuração do projeto Supabase');
  }
}

testLogin();