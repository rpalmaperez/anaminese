const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase usando variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configurações carregadas:');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? '✅ Carregada' : '❌ Não encontrada');
console.log('Service Key:', supabaseServiceKey ? '✅ Carregada' : '❌ Não encontrada');

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // 1. Testar conexão básica
    console.log('\n📡 Testando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabaseAnon
      .from('users')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro na conexão básica:', healthError.message);
    } else {
      console.log('✅ Conexão básica funcionando');
    }
    
    // 2. Testar autenticação
    console.log('\n🔐 Testando sistema de autenticação...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro no sistema de auth:', authError.message);
    } else {
      console.log(`✅ Sistema de auth funcionando - ${authUsers.users.length} usuários encontrados`);
    }
    
    // 3. Testar tabelas principais
    console.log('\n📊 Testando tabelas principais...');
    
    const tables = ['users', 'students', 'anamneses', 'notifications'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Erro na tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table} acessível`);
        }
      } catch (err) {
        console.log(`❌ Erro ao acessar tabela ${table}: ${err.message}`);
      }
    }
    
    // 4. Testar RLS (Row Level Security)
    console.log('\n🔒 Testando RLS (Row Level Security)...');
    
    try {
      // Tentar acessar dados sem autenticação (deve falhar se RLS estiver ativo)
      const { data: protectedData, error: rlsError } = await supabaseAnon
        .from('users')
        .select('*')
        .limit(1);
      
      if (rlsError) {
        console.log('✅ RLS ativo - acesso negado sem autenticação');
      } else {
        console.log('⚠️ RLS pode estar desabilitado - dados acessíveis sem auth');
      }
    } catch (err) {
      console.log('✅ RLS funcionando - erro esperado:', err.message);
    }
    
    // 5. Testar storage (se configurado)
    console.log('\n📁 Testando storage...');
    
    try {
      const { data: buckets, error: storageError } = await supabaseAdmin.storage.listBuckets();
      
      if (storageError) {
        console.log('⚠️ Storage não configurado ou com erro:', storageError.message);
      } else {
        console.log(`✅ Storage funcionando - ${buckets.length} buckets encontrados`);
      }
    } catch (err) {
      console.log('⚠️ Storage não disponível:', err.message);
    }
    
    console.log('\n🎉 Teste de conectividade concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral durante os testes:', error);
  }
}

testSupabaseConnection();