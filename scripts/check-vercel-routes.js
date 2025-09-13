const https = require('https');

const testRoutes = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/api/auth/login'
];

const testRoute = (path) => {
  return new Promise((resolve) => {
    const url = `https://anaminese.vercel.app${path}`;
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const is404 = data.includes('This page could not be found') || data.includes('404');
        const hasContent = data.length > 1000;
        
        resolve({
          path,
          statusCode: res.statusCode,
          is404,
          hasContent,
          contentLength: data.length
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        path,
        error: err.message,
        statusCode: 0
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        path,
        error: 'Timeout',
        statusCode: 0
      });
    });
  });
};

async function checkVercelRoutes() {
  console.log('🔍 Verificando rotas do site em produção...');
  console.log('Site: https://anaminese.vercel.app');
  console.log('');
  
  for (const route of testRoutes) {
    try {
      const result = await testRoute(route);
      
      if (result.error) {
        console.log(`❌ ${route}: Erro - ${result.error}`);
      } else if (result.is404) {
        console.log(`❌ ${route}: 404 - Página não encontrada`);
      } else if (result.statusCode === 200 && result.hasContent) {
        console.log(`✅ ${route}: OK - ${result.contentLength} bytes`);
      } else {
        console.log(`⚠️  ${route}: Status ${result.statusCode} - ${result.contentLength} bytes`);
      }
    } catch (error) {
      console.log(`❌ ${route}: Erro inesperado - ${error.message}`);
    }
  }
  
  console.log('');
  console.log('💡 Diagnóstico:');
  console.log('- Se /login retorna 404, a página não foi deployada corretamente');
  console.log('- Se outras páginas funcionam, pode ser problema específico da rota');
  console.log('- Verifique se o arquivo src/app/login/page.tsx existe no repositório');
}

checkVercelRoutes();