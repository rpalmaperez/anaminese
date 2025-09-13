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

async function testAnamneseUpdate() {
  try {
    console.log('Testando atualização de anamnese...');
    
    // Primeiro, vamos buscar uma anamnese existente
    const { data: anamneses, error: fetchError } = await supabase
      .from('anamneses')
      .select('*')
      .limit(1);
    
    if (fetchError) {
      console.error('Erro ao buscar anamnese:', fetchError);
      return;
    }
    
    if (!anamneses || anamneses.length === 0) {
      console.log('Nenhuma anamnese encontrada para testar');
      return;
    }
    
    const anamnese = anamneses[0];
    console.log('Anamnese encontrada:', anamnese.id);
    console.log('Status atual:', anamnese.status);
    
    // Dados de teste para atualização
    const updateData = {
      medical_history: {
        other_conditions: 'Teste de condições médicas',
        surgeries: ['Cirurgia teste'],
        hospitalizations: ['Hospitalização teste'],
        family_history: ['Histórico familiar teste']
      },
      current_medications: [
        { name: 'Medicamento teste', dosage: '10mg' }
      ],
      allergies: ['Alergia teste'],
      physical_limitations: [],
      lifestyle_habits: {
        physical_activity: {
          types: ['Caminhada'],
          frequency: 'Diário',
          duration: '30min'
        },
        diet: {
          type: 'Balanceada',
          restrictions: [],
          supplements: []
        },
        sleep: {
          hours_per_night: 8,
          quality: 'Boa'
        },
        smoking: {
          status: 'Não fumante',
          frequency: '',
          duration: ''
        },
        alcohol: {
          frequency: 'Ocasional',
          type: '',
          quantity: ''
        }
      },
      objectives: {
        primary: 'Objetivo primário teste',
        secondary: ['Objetivo secundário teste'],
        expectations: 'Expectativas teste'
      },
      updated_at: new Date().toISOString()
    };
    
    console.log('Tentando atualizar anamnese com dados:', JSON.stringify(updateData, null, 2));
    
    // Tentar atualizar
    const { data, error } = await supabase
      .from('anamneses')
      .update(updateData)
      .eq('id', anamnese.id)
      .select();
    
    if (error) {
      console.error('Erro na atualização:', error);
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
    } else {
      console.log('Atualização bem-sucedida!');
      console.log('Dados atualizados:', data);
    }
    
  } catch (err) {
    console.error('Erro geral:', err);
  }
}

testAnamneseUpdate();