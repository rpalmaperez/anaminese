const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Usar as configurações do .env.local com service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Conectando ao Supabase com Service Role:', supabaseUrl);

// Cliente com permissões administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente normal para auth
const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function resetUserPasswords() {
  console.log('\n🔐 Redefinindo senhas dos usuários principais...');
  
  // Usuários principais para redefinir senha
  const mainUsers = [
    { email: 'rpalmaperez@gmail.com', newPassword: 'admin123' },
    { email: 'digo_blaya@yahoo.com.br', newPassword: 'admin123' },
    { email: 'heloisahs51@gmail.com', newPassword: 'professor123' }
  ];

  try {
    // 1. Listar todos os usuários
    console.log('\n1️⃣ Listando usuários...');
    
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return;
    }

    console.log(`✅ ${users.users.length} usuários encontrados`);

    // 2. Redefinir senhas dos usuários principais
    for (const mainUser of mainUsers) {
      console.log(`\n👤 Processando: ${mainUser.email}`);
      
      const user = users.users.find(u => u.email === mainUser.email);
      
      if (!user) {
        console.error('❌ Usuário não encontrado!');
        continue;
      }

      console.log('✅ Usuário encontrado!');
      console.log('🆔 ID:', user.id);
      console.log('📧 Email confirmado:', user.email_confirmed_at ? 'Sim' : 'Não');

      // Redefinir senha
      console.log('🔐 Redefinindo senha...');
      
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          password: mainUser.newPassword,
          email_confirm: true // Garantir que o email está confirmado
        }
      );

      if (updateError) {
        console.error('❌ Erro ao redefinir senha:', updateError.message);
        continue;
      }

      console.log('✅ Senha redefinida com sucesso!');

      // Testar login
      console.log('🧪 Testando login...');
      
      const { data: loginData, error: loginError } = await supabaseAuth.auth.signInWithPassword({
        email: mainUser.email,
        password: mainUser.newPassword
      });

      if (loginError) {
        console.error('❌ Erro no teste de login:', loginError.message);
      } else {
        console.log('✅ Login testado com sucesso!');
        console.log('🆔 User ID:', loginData.user.id);
        
        // Fazer logout
        await supabaseAuth.auth.signOut();
      }

      console.log(`🎉 ${mainUser.email} - PRONTO PARA LOGIN!`);
    }

    console.log('\n📋 CREDENCIAIS ATUALIZADAS:');
    console.log('👤 rpalmaperez@gmail.com - Senha: admin123');
    console.log('👤 digo_blaya@yahoo.com.br - Senha: admin123');
    console.log('👤 heloisahs51@gmail.com - Senha: professor123');
    
    console.log('\n🌐 TESTE NO SITE DE PRODUÇÃO:');
    console.log('🔗 Acesse: https://anamnese-mu.vercel.app/login');
    console.log('📧 Use as credenciais acima para fazer login');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

resetUserPasswords();