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

async function testCurrentConditionFields() {
  try {
    console.log('🔍 Aplicando migração para campos da Condição Atual...');
    
    // Aplicar migração
    const migrationSQL = `
      ALTER TABLE anamneses 
      ADD COLUMN IF NOT EXISTS current_symptoms TEXT,
      ADD COLUMN IF NOT EXISTS symptom_duration TEXT,
      ADD COLUMN IF NOT EXISTS pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
      ADD COLUMN IF NOT EXISTS recent_exams TEXT,
      ADD COLUMN IF NOT EXISTS exam_results TEXT;
    `;
    
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (migrationError) {
      console.log('⚠️ Erro na migração (pode ser que as colunas já existam):', migrationError.message);
    } else {
      console.log('✅ Migração aplicada com sucesso!');
    }
    
    console.log('\n🔍 Testando campos da Condição Atual...');
    
    // Buscar uma anamnese existente
    const { data: anamneses, error: fetchError } = await supabase
      .from('anamneses')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Erro ao buscar anamneses:', fetchError.message);
      return;
    }
    
    if (!anamneses || anamneses.length === 0) {
      console.log('⚠️ Nenhuma anamnese encontrada para testar');
      return;
    }
    
    const anamnese = anamneses[0];
    console.log('📋 Anamnese encontrada:', anamnese.id);
    
    // Verificar se os campos existem
    console.log('\n📊 Campos da Condição Atual:');
    console.log('- current_symptoms:', anamnese.current_symptoms || 'VAZIO');
    console.log('- symptom_duration:', anamnese.symptom_duration || 'VAZIO');
    console.log('- pain_scale:', anamnese.pain_scale !== null ? anamnese.pain_scale : 'VAZIO');
    
    // Testar atualização dos campos
    console.log('\n🔄 Testando atualização dos campos...');
    
    const testData = {
      current_symptoms: 'Dor nas costas e rigidez muscular',
      symptom_duration: '2 semanas',
      pain_scale: 7
    };
    
    const { data: updateData, error: updateError } = await supabase
      .from('anamneses')
      .update(testData)
      .eq('id', anamnese.id)
      .select();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError.message);
      return;
    }
    
    console.log('✅ Atualização bem-sucedida!');
    console.log('📊 Dados atualizados:');
    console.log('- current_symptoms:', updateData[0].current_symptoms);
    console.log('- symptom_duration:', updateData[0].symptom_duration);
    console.log('- pain_scale:', updateData[0].pain_scale);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testCurrentConditionFields();