const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
);

async function testAnamneseFields() {
  try {
    console.log('🔍 Testando campos de anamnese...');
    
    // Buscar uma anamnese recente
    const { data: anamneses, error } = await supabase
      .from('anamneses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar anamneses:', error);
      return;
    }
    
    if (!anamneses || anamneses.length === 0) {
      console.log('⚠️ Nenhuma anamnese encontrada');
      return;
    }
    
    const anamnese = anamneses[0];
    console.log('📋 Anamnese encontrada:', anamnese.id);
    
    // Verificar campos específicos
    console.log('\n🔍 Verificando campos específicos:');
    
    // Campo additional_notes
    console.log('📝 additional_notes:', anamnese.additional_notes || 'VAZIO');
    
    // Campos dentro de lifestyle_habits
    if (anamnese.lifestyle_habits) {
      console.log('🏃 lifestyle_habits encontrado:');
      
      if (anamnese.lifestyle_habits.diet) {
        console.log('  🍽️ diet.habits:', anamnese.lifestyle_habits.diet.habits || 'VAZIO');
      } else {
        console.log('  🍽️ diet: NÃO ENCONTRADO');
      }
      
      if (anamnese.lifestyle_habits.sleep) {
        console.log('  😴 sleep.pattern:', anamnese.lifestyle_habits.sleep.pattern || 'VAZIO');
      } else {
        console.log('  😴 sleep: NÃO ENCONTRADO');
      }
    } else {
      console.log('🏃 lifestyle_habits: NÃO ENCONTRADO');
    }
    
    // Mostrar estrutura completa do lifestyle_habits
    console.log('\n📊 Estrutura completa do lifestyle_habits:');
    console.log(JSON.stringify(anamnese.lifestyle_habits, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testAnamneseFields();