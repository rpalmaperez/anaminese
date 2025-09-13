const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkStudents() {
  try {
    console.log('🔍 Verificando alunos cadastrados...');
    
    const { data, error } = await supabase
      .from('students')
      .select('id, name, email, phone')
      .order('name');

    if (error) {
      console.error('❌ Erro ao buscar alunos:', error);
      return;
    }

    console.log(`📊 Total de alunos: ${data?.length || 0}`);
    
    if (data && data.length > 0) {
      console.log('\n👥 Alunos encontrados:');
      data.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (ID: ${student.id})`);
        if (student.email) console.log(`   Email: ${student.email}`);
        if (student.phone) console.log(`   Telefone: ${student.phone}`);
        console.log('');
      });
    } else {
      console.log('⚠️ Nenhum aluno encontrado na base de dados');
      console.log('💡 Sugestão: Cadastre alguns alunos primeiro em /students/new');
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

checkStudents();