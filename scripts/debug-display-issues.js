const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente manualmente
const fs = require('fs');
const path = require('path');

let supabaseUrl, supabaseKey;

try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1];
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1];
    }
  });
} catch (error) {
  console.error('❌ Erro ao ler .env.local:', error.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDisplayIssues() {
  try {
    console.log('🔍 Investigando problemas de exibição...');
    
    // Buscar uma anamnese para análise
    const { data: anamneses, error: fetchError } = await supabase
      .from('anamneses')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Erro ao buscar anamneses:', fetchError);
      return;
    }
    
    if (!anamneses || anamneses.length === 0) {
      console.log('❌ Nenhuma anamnese encontrada');
      return;
    }
    
    const anamnese = anamneses[0];
    console.log('📋 Anamnese ID:', anamnese.id);
    
    console.log('\n🔍 ANÁLISE DOS CAMPOS:');
    
    // 1. Verificar current_condition
    console.log('\n1️⃣ CURRENT_CONDITION:');
    if (anamnese.current_condition) {
      console.log('   Estrutura:', JSON.stringify(anamnese.current_condition, null, 4));
      console.log('   - Sintomas:', anamnese.current_condition.symptoms ? '✅ Presente' : '❌ Ausente');
      console.log('   - Duração:', anamnese.current_condition.duration ? '✅ Presente' : '❌ Ausente');
      console.log('   - Escala de dor:', anamnese.current_condition.pain_scale !== undefined ? '✅ Presente' : '❌ Ausente');
    } else {
      console.log('   ❌ Campo current_condition está nulo/vazio');
    }
    
    // 2. Verificar exams
    console.log('\n2️⃣ EXAMS:');
    if (anamnese.exams) {
      console.log('   Estrutura:', JSON.stringify(anamnese.exams, null, 4));
      console.log('   - Exames recentes:', anamnese.exams.recent ? '✅ Presente' : '❌ Ausente');
      console.log('   - Resultados:', anamnese.exams.results ? '✅ Presente' : '❌ Ausente');
    } else {
      console.log('   ❌ Campo exams está nulo/vazio');
    }
    
    // 3. Verificar objectives (que não deveria existir)
    console.log('\n3️⃣ OBJECTIVES (problemático):');
    if (anamnese.objectives) {
      console.log('   Estrutura:', JSON.stringify(anamnese.objectives, null, 4));
      console.log('   - Expectations:', anamnese.objectives.expectations ? '⚠️ Presente (PROBLEMA!)' : '✅ Ausente');
    } else {
      console.log('   ✅ Campo objectives está nulo/vazio (correto)');
    }
    
    // 4. Verificar todos os campos JSONB
    console.log('\n4️⃣ TODOS OS CAMPOS JSONB:');
    const jsonbFields = ['current_condition', 'exams', 'objectives', 'medical_history', 'lifestyle_habits', 'current_medications', 'allergies'];
    
    jsonbFields.forEach(field => {
      if (anamnese[field]) {
        console.log(`   ${field}:`, typeof anamnese[field] === 'object' ? 'Objeto presente' : 'Valor presente');
      } else {
        console.log(`   ${field}: Nulo/vazio`);
      }
    });
    
    // 5. Simular as condições de exibição
    console.log('\n5️⃣ SIMULAÇÃO DAS CONDIÇÕES DE EXIBIÇÃO:');
    
    // Condição para Condição Atual
    const showCurrentCondition = anamnese.current_condition?.symptoms || 
                                anamnese.current_condition?.duration || 
                                anamnese.current_condition?.pain_scale || 
                                anamnese.objectives?.expectations;
    console.log('   Mostrar Condição Atual:', showCurrentCondition ? '✅ SIM' : '❌ NÃO');
    
    // Condição para Exames
    const showExams = anamnese.exams?.recent || anamnese.exams?.results;
    console.log('   Mostrar Exames:', showExams ? '✅ SIM' : '❌ NÃO');
    
    // Verificar se expectations está causando problema
    if (anamnese.objectives?.expectations) {
      console.log('   ⚠️ PROBLEMA: Campo expectations está presente e causando exibição indevida!');
    }
    
    console.log('\n6️⃣ RECOMENDAÇÕES:');
    if (!showExams && (anamnese.exams?.recent || anamnese.exams?.results)) {
      console.log('   - Exames têm dados mas não estão sendo exibidos');
    }
    if (anamnese.objectives?.expectations) {
      console.log('   - Remover campo objectives.expectations que não deveria existir');
    }
    if (!anamnese.current_condition?.duration) {
      console.log('   - Campo duration em current_condition está vazio');
    }
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

debugDisplayIssues();