#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Carregar variáveis do .env.local explicitamente
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

console.log('🔗 Configuração do Supabase Remoto');
console.log('==================================\n');

// Usar variáveis carregadas pelo dotenv
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Debug - Variáveis encontradas:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
  console.log('Execute primeiro: node scripts/setup-production-env.js');
  process.exit(1);
}

// Extrair project-ref da URL
const projectRef = supabaseUrl.match(/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Não foi possível extrair o project-ref da URL:', supabaseUrl);
  process.exit(1);
}

console.log('📋 Informações do projeto:');
console.log('Project URL:', supabaseUrl);
console.log('Project Ref:', projectRef);
console.log('');

try {
  // Configurar o config.toml com as informações do projeto
  const configPath = path.join(__dirname, '..', 'supabase', 'config.toml');
  
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Atualizar project_id no config.toml
    configContent = configContent.replace(
      /project_id = ".*"/,
      `project_id = "${projectRef}"`
    );
    
    // Atualizar api_url para usar o Supabase remoto
    configContent = configContent.replace(
      /api_url = ".*"/,
      `api_url = "${supabaseUrl}"`
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Arquivo config.toml atualizado');
  }
  
  // Tentar executar as migrações diretamente
  console.log('\n🚀 Executando migrações...');
  
  // Usar a service role key para executar as migrações
  process.env.SUPABASE_ACCESS_TOKEN = serviceRoleKey;
  process.env.SUPABASE_DB_URL = `postgresql://postgres:[password]@db.${projectRef}.supabase.co:5432/postgres`;
  
  try {
    execSync(`npx supabase db push --project-ref ${projectRef}`, {
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: serviceRoleKey }
    });
    console.log('\n✅ Migrações executadas com sucesso!');
  } catch (error) {
    console.log('\n⚠️ Erro ao executar migrações automaticamente.');
    console.log('Você pode tentar manualmente:');
    console.log(`1. npx supabase login`);
    console.log(`2. npx supabase link --project-ref ${projectRef}`);
    console.log(`3. npx supabase db push`);
  }
  
  console.log('\n🎉 Configuração concluída!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Reinicie o servidor: npm run dev');
  console.log('2. Teste a aplicação no navegador');
  console.log('3. Verifique se não aparece mais "usando dados mock"');
  
} catch (error) {
  console.error('❌ Erro durante a configuração:', error.message);
  process.exit(1);
}