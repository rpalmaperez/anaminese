const { createClient } = require('@supabase/supabase-js');

// Usar as credenciais do Supabase local
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
);

async function checkStudentData() {
  try {
    console.log('🔍 Verificando dados dos alunos...');
    
    const { data: students, error } = await supabase
      .from('students')
      .select('id, name, class_group, schedule, weekdays')
      .limit(10);
    
    if (error) {
      console.error('❌ Erro ao buscar alunos:', error);
      return;
    }
    
    console.log('📊 Dados dos alunos:');
    console.log('='.repeat(80));
    
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name}`);
      console.log(`   ID: ${student.id}`);
      console.log(`   Turma: ${student.class_group || 'Não definida'}`);
      console.log(`   Horário salvo: ${student.schedule || 'Não definido'}`);
      console.log(`   Dias salvos: ${student.weekdays || 'Não definidos'}`);
      console.log('-'.repeat(50));
    });
    
    console.log('\n🔍 Verificando como a função getClassSchedule processaria esses dados...');
    
    // Simular a função getClassSchedule
    const getClassSchedule = (classGroup) => {
      if (!classGroup) return { time: '', weekday: '' };
      
      const schedules = {
        'Turma A - Manhã': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
        'Turma 17': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
        'Turma A - Tarde': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
        'Turma B - Manhã': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
        'Turma B - Tarde': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
        'Turma C - Manhã': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
        'Turma C - Tarde': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      };
      
      // Verificar mapeamento direto
      if (schedules[classGroup]) {
        return schedules[classGroup];
      }
      
      // Extrair número da turma
      const numberMatch = classGroup.match(/\d+/);
      if (numberMatch) {
        const number = parseInt(numberMatch[0]);
        const remainder = number % 3;
        if (remainder === 1) return { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' };
        if (remainder === 2) return { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' };
        if (remainder === 0) return { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' };
      }
      
      // Verificar palavras-chave
      if (classGroup.toLowerCase().includes('manhã')) {
        return { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' };
      }
      if (classGroup.toLowerCase().includes('tarde')) {
        return { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' };
      }
      if (classGroup.toLowerCase().includes('noite')) {
        return { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' };
      }
      
      // Fallback baseado em hash
      let hash = 0;
      for (let i = 0; i < classGroup.length; i++) {
        const char = classGroup.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const remainder = Math.abs(hash) % 3;
      if (remainder === 0) return { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' };
      if (remainder === 1) return { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' };
      return { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' };
    };
    
    console.log('\n📋 Comparação: Dados salvos vs Dados calculados');
    console.log('='.repeat(80));
    
    students.forEach((student, index) => {
      const calculated = getClassSchedule(student.class_group);
      console.log(`${index + 1}. ${student.name}`);
      console.log(`   Turma: ${student.class_group || 'Não definida'}`);
      console.log(`   Horário salvo: ${student.schedule || 'Não definido'}`);
      console.log(`   Horário calculado: ${calculated.time}`);
      console.log(`   Dias salvos: ${student.weekdays || 'Não definidos'}`);
      console.log(`   Dias calculados: ${calculated.weekday}`);
      
      const scheduleMatch = student.schedule === calculated.time;
      const weekdaysMatch = student.weekdays === calculated.weekday;
      
      console.log(`   ✅ Horário correto: ${scheduleMatch ? 'SIM' : 'NÃO'}`);
      console.log(`   ✅ Dias corretos: ${weekdaysMatch ? 'SIM' : 'NÃO'}`);
      console.log('-'.repeat(50));
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkStudentData();