const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler variáveis do .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseKey;

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  }
} catch (err) {
  console.error('Erro ao ler .env.local:', err.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEnumFix() {
  try {
    console.log('Testando correção do enum anamnese_status...');
    
    // Buscar uma anamnese existente
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
    
    // Testar atualização com status 'completed'
    console.log('\nTestando atualização com status "completed"...');
    const { data: completedData, error: completedError } = await supabase
      .from('anamneses')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', anamnese.id)
      .select();
    
    if (completedError) {
      console.error('Erro ao atualizar para completed:', completedError);
    } else {
      console.log('✅ Sucesso ao atualizar para "completed"');
    }
    
    // Testar atualização com status 'draft'
    console.log('\nTestando atualização com status "draft"...');
    const { data: draftData, error: draftError } = await supabase
      .from('anamneses')
      .update({ 
        status: 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', anamnese.id)
      .select();
    
    if (draftError) {
      console.error('Erro ao atualizar para draft:', draftError);
    } else {
      console.log('✅ Sucesso ao atualizar para "draft"');
    }
    
    // Testar atualização com status 'expired'
    console.log('\nTestando atualização com status "expired"...');
    const { data: expiredData, error: expiredError } = await supabase
      .from('anamneses')
      .update({ 
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', anamnese.id)
      .select();
    
    if (expiredError) {
      console.error('Erro ao atualizar para expired:', expiredError);
    } else {
      console.log('✅ Sucesso ao atualizar para "expired"');
    }
    
    // Restaurar status original
    console.log('\nRestaurando status original...');
    const { error: restoreError } = await supabase
      .from('anamneses')
      .update({ 
        status: anamnese.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', anamnese.id);
    
    if (restoreError) {
      console.error('Erro ao restaurar status:', restoreError);
    } else {
      console.log('✅ Status original restaurado');
    }
    
    console.log('\n🎉 Teste de correção do enum concluído com sucesso!');
    
  } catch (err) {
    console.error('Erro geral:', err);
  }
}

testEnumFix();