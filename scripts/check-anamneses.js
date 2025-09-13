const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente do .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAnamneses() {
  try {
    console.log('🔍 Verificando anamneses no banco de dados...');
    
    // Verificar todas as anamneses
    const { data: allAnamneses, error: allError } = await supabase
      .from('anamneses')
      .select('id, student_id, status, created_at')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Erro ao buscar anamneses:', allError);
      return;
    }
    
    console.log(`📊 Total de anamneses: ${allAnamneses?.length || 0}`);
    
    if (allAnamneses && allAnamneses.length > 0) {
      console.log('\n📋 Primeiras 5 anamneses:');
      allAnamneses.slice(0, 5).forEach((anamnese, index) => {
        console.log(`${index + 1}. ID: ${anamnese.id}`);
        console.log(`   Student ID: ${anamnese.student_id}`);
        console.log(`   Status: ${anamnese.status}`);
        console.log(`   Criada em: ${anamnese.created_at}`);
        console.log('');
      });
    }
    
    // Verificar anamnese específica com ID 1
    const { data: anamnese1, error: error1 } = await supabase
      .from('anamneses')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error1) {
      console.log('❌ Anamnese com ID 1 não encontrada:', error1.message);
    } else {
      console.log('✅ Anamnese com ID 1 encontrada:', anamnese1);
    }
    
    // Verificar se existem estudantes
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, name')
      .limit(5);
    
    if (studentsError) {
      console.error('❌ Erro ao buscar estudantes:', studentsError);
    } else {
      console.log(`\n👥 Total de estudantes encontrados: ${students?.length || 0}`);
      if (students && students.length > 0) {
        console.log('Primeiros estudantes:');
        students.forEach(student => {
          console.log(`- ${student.name} (ID: ${student.id})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAnamneses();