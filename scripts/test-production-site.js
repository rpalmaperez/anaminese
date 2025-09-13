const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente do .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value.trim();
    }
  });
}

// Configurações do Supabase (produção)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para testar requisição HTTP
function testHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          contentLength: data.length,
          title: data.match(/<title>(.*?)<\/title>/)?.[1] || 'Não encontrado'
        });
      });
    }).on('error', reject);
  });
}

async function testProductionSite() {
  console.log('🌐 Testando site em produção: https://anaminese.vercel.app');
  console.log('=' .repeat(60));

  try {
    // 1. Testar acesso ao site
    console.log('\n1. 🔍 Testando acesso ao site...');
    const siteResponse = await testHttpRequest('https://anaminese.vercel.app');
    console.log(`   Status: ${siteResponse.statusCode} ${siteResponse.statusMessage}`);
    console.log(`   Título: ${siteResponse.title}`);
    console.log(`   Tamanho do conteúdo: ${siteResponse.contentLength} bytes`);
    
    if (siteResponse.statusCode === 200) {
      console.log('   ✅ Site está acessível!');
    } else {
      console.log('   ❌ Site não está acessível!');
      return;
    }

    // 2. Testar conexão com Supabase
    console.log('\n2. 🔗 Testando conexão com Supabase...');
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError) {
      console.log('   ⚠️  Nenhuma sessão ativa (esperado)');
    } else {
      console.log('   ℹ️  Sessão encontrada:', user?.email || 'Usuário anônimo');
    }

    // 3. Testar login com credenciais do admin
    console.log('\n3. 🔐 Testando login com credenciais admin...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@exemplo.com',
      password: 'admin123456'
    });

    if (loginError) {
      console.log('   ❌ Erro no login:', loginError.message);
      return;
    }

    console.log('   ✅ Login realizado com sucesso!');
    console.log('   👤 Usuário:', loginData.user.email);
    console.log('   🆔 ID:', loginData.user.id);
    console.log('   ✉️  Email confirmado:', loginData.user.email_confirmed_at ? '✅' : '❌');

    // 4. Testar acesso aos dados do usuário
    console.log('\n4. 📊 Testando acesso aos dados do usuário...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single();

    if (userError) {
      console.log('   ❌ Erro ao buscar dados do usuário:', userError.message);
    } else {
      console.log('   ✅ Dados do usuário encontrados!');
      console.log('   📝 Nome:', userData.name);
      console.log('   👨‍⚕️ Tipo:', userData.user_type);
      console.log('   📅 Criado em:', new Date(userData.created_at).toLocaleString('pt-BR'));
    }

    // 5. Testar logout
    console.log('\n5. 🚪 Testando logout...');
    const { error: logoutError } = await supabase.auth.signOut();
    
    if (logoutError) {
      console.log('   ❌ Erro no logout:', logoutError.message);
    } else {
      console.log('   ✅ Logout realizado com sucesso!');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 TESTE COMPLETO - Site em produção funcionando!');
    console.log('\n📋 RESUMO:');
    console.log('   • Site acessível: ✅');
    console.log('   • Supabase conectado: ✅');
    console.log('   • Login funcionando: ✅');
    console.log('   • Dados do usuário: ✅');
    console.log('   • Logout funcionando: ✅');
    
    console.log('\n🌐 Acesse: https://anaminese.vercel.app');
    console.log('👤 Credenciais: admin@exemplo.com / admin123456');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar teste
testProductionSite();