const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Cliente admin para verificação completa
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

// Cliente anônimo
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugProfileCreation() {
  console.log('🔍 Debugando criação de perfil...');

  try {
    // 1. Listar todos os usuários na tabela users
    console.log('\n1️⃣ Listando todos os perfis na tabela users...');
    const { data: allProfiles, error: profilesError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro ao listar perfis:', profilesError);
    } else {
      console.log('📋 Últimos 5 perfis criados:');
      allProfiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ID: ${profile.id}`);
        console.log(`     Email: ${profile.email}`);
        console.log(`     Nome: ${profile.name}`);
        console.log(`     Criado: ${profile.created_at}`);
        console.log('');
      });
    }

    // 2. Listar usuários de auth recentes
    console.log('\n2️⃣ Listando usuários de auth recentes...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários de auth:', authError);
    } else {
      console.log('👥 Últimos 5 usuários de auth:');
      const recentAuthUsers = authUsers.users
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      recentAuthUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id}`);
        console.log(`     Email: ${user.email}`);
        console.log(`     Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
        console.log(`     Criado: ${user.created_at}`);
        console.log('');
      });
    }

    // 3. Verificar se há usuários de auth sem perfil
    console.log('\n3️⃣ Verificando usuários de auth sem perfil...');
    if (authUsers && allProfiles) {
      const authUserIds = new Set(authUsers.users.map(u => u.id));
      const profileIds = new Set(allProfiles.map(p => p.id));
      
      const usersWithoutProfile = authUsers.users.filter(u => !profileIds.has(u.id));
      
      if (usersWithoutProfile.length > 0) {
        console.log('⚠️ Usuários de auth sem perfil:');
        usersWithoutProfile.forEach((user, index) => {
          console.log(`  ${index + 1}. ID: ${user.id}`);
          console.log(`     Email: ${user.email}`);
          console.log(`     Criado: ${user.created_at}`);
        });
      } else {
        console.log('✅ Todos os usuários de auth têm perfil correspondente');
      }
    }

    // 4. Testar inserção direta com service role
    console.log('\n4️⃣ Testando inserção direta com service role...');
    const testId = 'test-' + Date.now();
    const testEmail = `debug.test.${Date.now()}@gmail.com`;
    
    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: testId,
        email: testEmail,
        name: 'Debug Test User',
        role: 'professor'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro na inserção direta:', insertError);
    } else {
      console.log('✅ Inserção direta bem-sucedida:', insertResult);
      
      // Limpar o teste
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', testId);
      console.log('🧹 Dados de teste limpos');
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

debugProfileCreation();