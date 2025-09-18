const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configurações do .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 CONFIGURAÇÕES DO AMBIENTE:');
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NÃO DEFINIDA');
console.log('🔐 Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'NÃO DEFINIDA');

// Cliente com permissões administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente normal para auth
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

async function testProductionConnection() {
  console.log('\n🧪 TESTANDO CONEXÃO COM PRODUÇÃO...');
  
  try {
    // 1. Testar conexão básica
    console.log('\n1️⃣ Testando conexão básica...');
    
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro na conexão:', listError.message);
      return;
    }

    console.log(`✅ Conexão OK - ${users.users.length} usuários encontrados`);

    // 2. Verificar usuários específicos
    console.log('\n2️⃣ Verificando usuários específicos...');
    
    const testUsers = [
      'rpalmaperez@gmail.com',
      'digo_blaya@yahoo.com.br', 
      'heloisahs51@gmail.com'
    ];

    for (const email of testUsers) {
      const user = users.users.find(u => u.email === email);
      
      if (user) {
        console.log(`✅ ${email}:`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log(`   📧 Email confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
        console.log(`   🕐 Criado em: ${new Date(user.created_at).toLocaleString()}`);
        console.log(`   🔄 Última atualização: ${new Date(user.updated_at).toLocaleString()}`);
        
        // Verificar metadados
        if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
          console.log(`   📋 Metadados:`, user.user_metadata);
        }
      } else {
        console.log(`❌ ${email}: Usuário não encontrado`);
      }
    }

    // 3. Testar login com diferentes senhas
    console.log('\n3️⃣ Testando diferentes senhas...');
    
    const testCredentials = [
      { email: 'rpalmaperez@gmail.com', passwords: ['admin123', 'senha123', '123456'] },
      { email: 'digo_blaya@yahoo.com.br', passwords: ['admin123', 'senha123', '123456'] },
      { email: 'heloisahs51@gmail.com', passwords: ['professor123', 'admin123', 'senha123'] }
    ];

    for (const cred of testCredentials) {
      console.log(`\n👤 Testando ${cred.email}:`);
      
      for (const password of cred.passwords) {
        console.log(`   🔐 Tentando senha: ${password}`);
        
        const { data: loginData, error: loginError } = await supabaseAuth.auth.signInWithPassword({
          email: cred.email,
          password: password
        });

        if (loginError) {
          console.log(`   ❌ Falhou: ${loginError.message}`);
        } else {
          console.log(`   ✅ SUCESSO! Login realizado com sucesso`);
          console.log(`   🆔 User ID: ${loginData.user.id}`);
          
          // Fazer logout
          await supabaseAuth.auth.signOut();
          break;
        }
      }
    }

    // 4. Verificar configurações de auth
    console.log('\n4️⃣ Verificando configurações de autenticação...');
    
    // Tentar obter configurações (se possível)
    try {
      const { data: config, error: configError } = await supabaseAdmin
        .from('auth.config')
        .select('*')
        .limit(1);
        
      if (!configError && config) {
        console.log('✅ Configurações de auth acessíveis');
      }
    } catch (e) {
      console.log('ℹ️ Configurações de auth não acessíveis via API');
    }

    console.log('\n📋 RESUMO:');
    console.log('🌐 URL do Supabase:', supabaseUrl);
    console.log('🔗 Site de produção: https://anamnese-mu.vercel.app/login');
    console.log('📊 Total de usuários:', users.users.length);
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('1. Verifique se as senhas foram realmente atualizadas');
    console.log('2. Teste o login manual no site de produção');
    console.log('3. Verifique se há diferenças entre ambiente local e produção');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

testProductionConnection();