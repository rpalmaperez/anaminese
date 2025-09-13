const https = require('https');
const http = require('http');

const testUrl = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          contentLength: data.length,
          hasLoginForm: data.includes('type="email"') && data.includes('type="password"'),
          hasJavaScript: data.includes('<script'),
          hasCSS: data.includes('<link') && data.includes('stylesheet'),
          title: data.match(/<title>(.*?)<\/title>/)?.[1] || 'Não encontrado'
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

async function testProductionLogin() {
  console.log('🔍 Testando página de login em produção...');
  console.log('URL: https://anaminese.vercel.app/login');
  console.log('');
  
  try {
    const result = await testUrl('https://anaminese.vercel.app/login');
    
    console.log('📊 Resultados do teste:');
    console.log(`Status: ${result.statusCode} ${result.statusMessage}`);
    console.log(`Título: ${result.title}`);
    console.log(`Tamanho do conteúdo: ${result.contentLength} bytes`);
    console.log(`Formulário de login encontrado: ${result.hasLoginForm ? '✅ Sim' : '❌ Não'}`);
    console.log(`JavaScript carregado: ${result.hasJavaScript ? '✅ Sim' : '❌ Não'}`);
    console.log(`CSS carregado: ${result.hasCSS ? '✅ Sim' : '❌ Não'}`);
    console.log('');
    
    if (result.statusCode === 200) {
      console.log('✅ Página de login está acessível!');
      
      if (!result.hasLoginForm) {
        console.log('⚠️  PROBLEMA: Formulário de login não encontrado no HTML!');
      }
      
      if (!result.hasJavaScript) {
        console.log('⚠️  PROBLEMA: JavaScript não encontrado - pode afetar a funcionalidade!');
      }
      
      if (!result.hasCSS) {
        console.log('⚠️  PROBLEMA: CSS não encontrado - pode afetar a aparência!');
      }
    } else {
      console.log(`❌ Problema de acesso: Status ${result.statusCode}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar página de login:', error.message);
  }
  
  // Testar também a página principal
  console.log('\n🔍 Testando página principal para comparação...');
  try {
    const mainResult = await testUrl('https://anaminese.vercel.app');
    console.log(`Página principal - Status: ${mainResult.statusCode}, Título: ${mainResult.title}`);
  } catch (error) {
    console.error('❌ Erro ao testar página principal:', error.message);
  }
}

testProductionLogin();