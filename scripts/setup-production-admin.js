const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente do .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value.trim();
    }
  });
}

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  process.exit(1);
}

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Cliente normal para testes
const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function setupProductionAdmin() {
  console.log('🚀 Configurando usuário admin no ambiente de produção');
  console.log('=' .repeat(60));

  const adminEmail = 'admin@exemplo.com';
  const adminPassword = 'admin123456';
  const adminName = 'Administrador';

  try {
    // 1. Verificar se o usuário já existe no Auth
    console.log('\n1. 🔍 Verificando usuário existente...');
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.log('   ❌ Erro ao listar usuários:', listError.message);
      return;
    }

    const existingUser = existingUsers.users.find(user => user.email === adminEmail);
    
    let userId;
    
    if (existingUser) {
      console.log('   ✅ Usuário encontrado no Auth:', existingUser.email);
      console.log('   🆔 ID:', existingUser.id);
      userId = existingUser.id;
      
      // Atualizar senha se necessário
      console.log('\n2. 🔐 Atualizando senha do usuário...');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: adminPassword }
      );
      
      if (updateError) {
        console.log('   ❌ Erro ao atualizar senha:', updateError.message);
      } else {
        console.log('   ✅ Senha atualizada com sucesso!');
      }
    } else {
      // Criar novo usuário
      console.log('   ℹ️  Usuário não encontrado, criando novo...');
      
      console.log('\n2. 👤 Criando usuário no Auth...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
      });
      
      if (createError) {
        console.log('   ❌ Erro ao criar usuário:', createError.message);
        return;
      }
      
      console.log('   ✅ Usuário criado no Auth!');
      console.log('   🆔 ID:', newUser.user.id);
      userId = newUser.user.id;
    }

    // 3. Verificar/criar registro na tabela users
    console.log('\n3. 📊 Verificando registro na tabela users...');
    const { data: existingUserData, error: selectError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.log('   ❌ Erro ao verificar tabela users:', selectError.message);
      return;
    }

    if (existingUserData) {
      console.log('   ✅ Registro encontrado na tabela users');
      console.log('   📝 Nome:', existingUserData.name);
      console.log('   👨‍⚕️ Tipo:', existingUserData.user_type);
    } else {
      console.log('   ℹ️  Registro não encontrado, criando na tabela users...');
      
      const { data: newUserData, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          name: adminName,
          email: adminEmail,
          user_type: 'admin'
        })
        .select()
        .single();

      if (insertError) {
        console.log('   ❌ Erro ao criar registro na tabela users:', insertError.message);
        return;
      }

      console.log('   ✅ Registro criado na tabela users!');
      console.log('   📝 Nome:', newUserData.name);
      console.log('   👨‍⚕️ Tipo:', newUserData.user_type);
    }

    // 4. Confirmar email se necessário
    console.log('\n4. ✉️  Confirmando email...');
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true }
    );
    
    if (confirmError) {
      console.log('   ❌ Erro ao confirmar email:', confirmError.message);
    } else {
      console.log('   ✅ Email confirmado!');
    }

    // 5. Testar login
    console.log('\n5. 🧪 Testando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });

    if (loginError) {
      console.log('   ❌ Erro no teste de login:', loginError.message);
    } else {
      console.log('   ✅ Login testado com sucesso!');
      console.log('   👤 Usuário:', loginData.user.email);
      console.log('   🆔 ID:', loginData.user.id);
      
      // Logout após teste
      await supabase.auth.signOut();
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 CONFIGURAÇÃO COMPLETA!');
    console.log('\n📋 CREDENCIAIS DE ACESSO:');
    console.log('   🌐 Site: https://anaminese.vercel.app');
    console.log('   📧 Email: admin@exemplo.com');
    console.log('   🔐 Senha: admin123456');
    console.log('   👨‍⚕️ Tipo: Administrador');

  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar configuração
setupProductionAdmin();