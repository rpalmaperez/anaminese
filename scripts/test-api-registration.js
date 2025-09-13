const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Cliente para verificação
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Cliente admin para limpeza
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

async function testApiRegistration() {
  const testUser = {
    email: `teste.api.${Date.now()}@gmail.com`,
    password: 'senha123456',
    userData: {
      name: 'Teste API Usuario',
      role: 'professor',
      phone: '(11) 99999-9999',
      department: 'Medicina',
      specialization: 'Cardiologia'
    }
  };

  console.log('🧪 Testando registro via API route...');
  console.log('📧 Email:', testUser.email);

  try {
    // 1. Testar registro via API
    console.log('\n1️⃣ Fazendo requisição para /api/auth/register...');
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erro na API:', result.error);
      return;
    }

    console.log('✅ Usuário criado via API:', result.message);
    console.log('👤 ID do usuário:', result.user?.id);

    // 2. Verificar se o usuário foi criado no auth
    console.log('\n2️⃣ Verificando usuário no auth...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários de auth:', authError);
      return;
    }

    const createdAuthUser = authUsers.users.find(u => u.email === testUser.email);
    if (createdAuthUser) {
      console.log('✅ Usuário encontrado no auth:', createdAuthUser.id);
    } else {
      console.log('❌ Usuário não encontrado no auth');
    }

    // 3. Verificar se o perfil foi criado
    console.log('\n3️⃣ Verificando perfil na tabela users...');
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testUser.email)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
    } else {
      console.log('✅ Perfil encontrado:', {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role
      });
    }

    // 4. Testar login com o usuário criado
    console.log('\n4️⃣ Testando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso:', loginData.user?.email);
      
      // Fazer logout
      await supabase.auth.signOut();
    }

    // 5. Limpeza
    console.log('\n5️⃣ Limpando dados de teste...');
    if (createdAuthUser) {
      // Deletar perfil
      const { error: deleteProfileError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', createdAuthUser.id);

      if (deleteProfileError) {
        console.error('⚠️ Erro ao deletar perfil:', deleteProfileError);
      } else {
        console.log('✅ Perfil deletado');
      }

      // Deletar usuário de auth
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(createdAuthUser.id);
      
      if (deleteAuthError) {
        console.error('⚠️ Erro ao deletar usuário de auth:', deleteAuthError);
      } else {
        console.log('✅ Usuário de auth deletado');
      }
    }

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testApiRegistration();