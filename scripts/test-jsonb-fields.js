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

async function testJSONBFields() {
  try {
    console.log('🔍 Testando campos JSONB da Condição Atual e Exames...');
    
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
    
    // Verificar campos JSONB atuais
    console.log('\n📊 Campos JSONB atuais:');
    console.log('- current_condition:', JSON.stringify(anamnese.current_condition, null, 2));
    console.log('- exams:', JSON.stringify(anamnese.exams, null, 2));
    
    // Testar atualização com dados de teste
    console.log('\n🔄 Testando atualização dos campos JSONB...');
    
    const testData = {
      current_condition: {
        symptoms: 'Dor lombar intensa e rigidez muscular',
        duration: '3 semanas',
        pain_scale: 8
      },
      exams: {
        recent: 'Ressonância magnética da coluna lombar (15/01/2024)',
        results: 'Hérnia de disco L4-L5 com compressão radicular'
      }
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
    console.log('\n📊 Dados atualizados:');
    console.log('- current_condition:', JSON.stringify(updateData[0].current_condition, null, 2));
    console.log('- exams:', JSON.stringify(updateData[0].exams, null, 2));
    
    // Verificar se os dados podem ser lidos corretamente
    console.log('\n🔍 Verificando leitura dos dados...');
    const { data: readData, error: readError } = await supabase
      .from('anamneses')
      .select('current_condition, exams')
      .eq('id', anamnese.id)
      .single();
    
    if (readError) {
      console.error('❌ Erro ao ler dados:', readError.message);
      return;
    }
    
    console.log('✅ Leitura bem-sucedida!');
    console.log('\n📋 Campos individuais:');
    console.log('- Sintomas:', readData.current_condition?.symptoms || 'VAZIO');
    console.log('- Duração:', readData.current_condition?.duration || 'VAZIO');
    console.log('- Escala de Dor:', readData.current_condition?.pain_scale || 'VAZIO');
    console.log('- Exames Recentes:', readData.exams?.recent || 'VAZIO');
    console.log('- Resultados:', readData.exams?.results || 'VAZIO');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testJSONBFields();