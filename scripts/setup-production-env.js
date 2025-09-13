#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupProductionEnv() {
  console.log('🚀 Configuração do Supabase Externo (Produção)');
  console.log('================================================\n');
  
  console.log('Antes de continuar, certifique-se de que você:');
  console.log('✅ Criou um projeto no Supabase Cloud (https://supabase.com/dashboard)');
  console.log('✅ Tem as credenciais do projeto em mãos\n');
  
  const proceed = await question('Deseja continuar? (s/n): ');
  if (proceed.toLowerCase() !== 's' && proceed.toLowerCase() !== 'sim') {
    console.log('Configuração cancelada.');
    rl.close();
    return;
  }
  
  console.log('\n📝 Insira as informações do seu projeto Supabase:\n');
  
  // Coletar informações
  const projectUrl = await question('Project URL (https://[seu-projeto-id].supabase.co): ');
  const anonKey = await question('Anon/Public Key: ');
  const serviceRoleKey = await question('Service Role Key: ');
  
  // Validar URLs
  if (!projectUrl.startsWith('https://') || !projectUrl.includes('.supabase.co')) {
    console.error('❌ URL do projeto inválida. Deve ser no formato: https://[projeto-id].supabase.co');
    rl.close();
    return;
  }
  
  if (!anonKey || anonKey.length < 100) {
    console.error('❌ Anon Key parece inválida. Verifique se copiou corretamente.');
    rl.close();
    return;
  }
  
  if (!serviceRoleKey || serviceRoleKey.length < 100) {
    console.error('❌ Service Role Key parece inválida. Verifique se copiou corretamente.');
    rl.close();
    return;
  }
  
  // Ler arquivo .env.local atual
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('\n📄 Arquivo .env.local encontrado. Fazendo backup...');
    
    // Fazer backup
    const backupPath = path.join(__dirname, '..', '.env.local.backup');
    fs.writeFileSync(backupPath, envContent);
    console.log(`✅ Backup salvo em: ${backupPath}`);
  }
  
  // Atualizar variáveis do Supabase
  const lines = envContent.split('\n');
  const updatedLines = [];
  let foundSupabaseUrl = false;
  let foundAnonKey = false;
  let foundServiceKey = false;
  
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      updatedLines.push(`NEXT_PUBLIC_SUPABASE_URL=${projectUrl}`);
      foundSupabaseUrl = true;
    } else if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      updatedLines.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`);
      foundAnonKey = true;
    } else if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      updatedLines.push(`SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`);
      foundServiceKey = true;
    } else {
      updatedLines.push(line);
    }
  }
  
  // Adicionar variáveis que não existiam
  if (!foundSupabaseUrl) {
    updatedLines.push(`NEXT_PUBLIC_SUPABASE_URL=${projectUrl}`);
  }
  if (!foundAnonKey) {
    updatedLines.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`);
  }
  if (!foundServiceKey) {
    updatedLines.push(`SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`);
  }
  
  // Salvar arquivo atualizado
  const newEnvContent = updatedLines.join('\n');
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('\n✅ Arquivo .env.local atualizado com sucesso!');
  console.log('\n🔄 Próximos passos:');
  console.log('1. Execute: npx supabase link --project-ref [seu-projeto-id]');
  console.log('2. Execute: npx supabase db push');
  console.log('3. Reinicie o servidor: npm run dev');
  console.log('\n📖 Para mais detalhes, consulte: SUPABASE_PRODUCTION_SETUP.md');
  
  rl.close();
}

setupProductionEnv().catch(console.error);