const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Cliente admin para confirmar usuários
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function confirmAllUsers() {
  try {
    console.log('🔄 Confirmando todos os usuários...');
    
    // Listar todos os usuários de auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários:', authError);
      return;
    }
    
    console.log(`📋 Encontrados ${authUsers.users.length} usuários`);
    
    // Confirmar cada usuário
    for (const user of authUsers.users) {
      console.log(`🔄 Confirmando usuário: ${user.email}`);
      
      if (user.email_confirmed_at) {
        console.log(`   ✅ ${user.email} já está confirmado`);
        continue;
      }
      
      // Confirmar o usuário
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );
      
      if (error) {
        console.error(`   ❌ Erro ao confirmar ${user.email}:`, error.message);
      } else {
        console.log(`   ✅ ${user.email} confirmado com sucesso`);
      }
    }
    
    console.log('\n🎉 Processo de confirmação concluído!');
    
    // Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    const { data: finalUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    console.log('\n📋 Status final dos usuários:');
    finalUsers?.users.forEach(user => {
      const status = user.email_confirmed_at ? '✅ Confirmado' : '❌ Não confirmado';
      console.log(`- ${user.email}: ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

confirmAllUsers().catch(console.error);