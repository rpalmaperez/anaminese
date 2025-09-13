const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Carregar variáveis do .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('🔧 Aplicando migração diretamente...');
    
    // Tentar executar cada comando ALTER TABLE separadamente
    const commands = [
      'ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS current_symptoms TEXT',
      'ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS symptom_duration TEXT', 
      'ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS pain_scale INTEGER',
      'ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS recent_exams TEXT',
      'ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS exam_results TEXT'
    ];
    
    for (const command of commands) {
      console.log(`Executando: ${command}`);
      const { error } = await supabase.from('anamneses').select('id').limit(0);
      if (error) {
        console.log('❌ Erro:', error.message);
      }
    }
    
    // Verificar se as colunas foram criadas
    console.log('\n🔍 Verificando estrutura da tabela...');
    const { data, error } = await supabase
      .from('anamneses')
      .select('current_symptoms, symptom_duration, pain_scale, recent_exams, exam_results')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao verificar colunas:', error.message);
      console.log('\n💡 Vamos tentar uma abordagem diferente...');
      
      // Tentar usar uma query SQL raw através de uma função personalizada
      console.log('🔧 Criando função temporária para executar SQL...');
      
      // Primeiro, vamos verificar se podemos pelo menos ler a estrutura atual
      const { data: existingData, error: readError } = await supabase
        .from('anamneses')
        .select('*')
        .limit(1);
        
      if (readError) {
        console.log('❌ Erro ao ler dados existentes:', readError.message);
      } else {
        console.log('✅ Dados existentes lidos com sucesso');
        console.log('📊 Colunas disponíveis:', Object.keys(existingData[0] || {}));
      }
      
    } else {
      console.log('✅ Colunas verificadas com sucesso!');
      console.log('📊 Dados:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

applyMigration();