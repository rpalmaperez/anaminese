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

async function confirmUserEmail() {
  console.log('\n📧 Confirmando email do usuário...');
  
  const userEmail = 'admin@exemplo.com';
  
  try {
    // 1. Buscar usuário por email
    console.log('\n1️⃣ Buscando usuário por email...');
    
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return;
    }
    
    const user = users.users.find(u => u.email === userEmail);
    
    if (!user) {
      console.error('❌ Usuário não encontrado!');
      return;
    }
    
    console.log('✅ Usuário encontrado!');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Email confirmado:', user.email_confirmed_at ? 'Sim' : 'Não');
    
    // 2. Confirmar email se necessário
    if (!user.email_confirmed_at) {
      console.log('\n2️⃣ Confirmando email...');
      
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          email_confirm: true
        }
      );
      
      if (updateError) {
        console.error('❌ Erro ao confirmar email:', updateError.message);
        return;
      }
      
      console.log('✅ Email confirmado com sucesso!');
    } else {
      console.log('✅ Email já estava confirmado!');
    }
    
    // 3. Testar login
    console.log('\n3️⃣ Testando login...');
    
    const { data: loginData, error: loginError } = await supabaseAuth.auth.signInWithPassword({
      email: userEmail,
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('User ID:', loginData.user.id);
    console.log('Email:', loginData.user.email);
    console.log('Email confirmado:', loginData.user.email_confirmed_at ? 'Sim' : 'Não');
    
    // Buscar dados completos do usuário
    const { data: fullUserData, error: fetchError } = await supabaseAuth
      .from('users')
      .select('*')
      .eq('id', loginData.user.id)
      .single();
    
    if (fetchError) {
      console.error('❌ Erro ao buscar dados do usuário:', fetchError.message);
    } else {
      console.log('\n✅ Dados completos do usuário:');
      console.table(fullUserData);
    }
    
    // Fazer logout
    await supabaseAuth.auth.signOut();
    
    console.log('\n🎉 USUÁRIO PRONTO PARA LOGIN!');
    console.log('\n📋 CREDENCIAIS:');
    console.log('Email:', userEmail);
    console.log('Senha: admin123');
    console.log('\n💡 Agora você pode fazer login na aplicação!');
    console.log('🌐 Acesse: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

confirmUserEmail();