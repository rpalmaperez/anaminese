const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('Testando login...');
  
  try {
    // Tentar fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@hidroginastica.com',
      password: 'admin123'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);
    
    // Tentar buscar perfil
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError.message);
      console.log('Detalhes:', profileError);
    } else {
      console.log('✅ Perfil encontrado:', profileData);
    }
    
    // Listar todos os usuários para debug
    const { data: allUsers, error: listError } = await supabase
      .from('users')
      .select('id, email, name, role');
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
    } else {
      console.log('\n📋 Todos os usuários na tabela:');
      console.table(allUsers);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testLogin();