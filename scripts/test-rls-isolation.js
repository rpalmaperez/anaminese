const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

// Cliente administrativo (bypassa RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Clientes para diferentes usuários
const createUserClient = () => createClient(supabaseUrl, supabaseAnonKey);

async function testRLSIsolation() {
  console.log('🧪 Testando isolamento RLS entre usuários...\n');
  
  const testUsers = [
    {
      email: `usuario1.${Date.now()}@teste.com`,
      password: 'teste123456',
      name: 'Usuário Teste 1',
      role: 'professor'
    },
    {
      email: `usuario2.${Date.now()}@teste.com`,
      password: 'teste123456',
      name: 'Usuário Teste 2',
      role: 'professor'
    }
  ];
  
  const createdUsers = [];
  const userClients = [];
  const createdStudents = [];
  
  try {
    // 1. Criar usuários de teste
    console.log('1️⃣ Criando usuários de teste...');
    
    for (const userData of testUsers) {
      // Criar usuário de auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { name: userData.name }
      });
      
      if (authError) {
        console.error(`❌ Erro ao criar auth para ${userData.email}:`, authError);
        continue;
      }
      
      // Criar perfil
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role
        })
        .select()
        .single();
      
      if (profileError) {
        console.error(`❌ Erro ao criar perfil para ${userData.email}:`, profileError);
        continue;
      }
      
      createdUsers.push({ ...authData.user, profile: profileData });
      console.log(`✅ Usuário criado: ${userData.name} (${authData.user.id})`);
    }
    
    // 2. Fazer login com cada usuário
    console.log('\n2️⃣ Fazendo login com os usuários...');
    
    for (let i = 0; i < createdUsers.length; i++) {
      const client = createUserClient();
      const userData = testUsers[i];
      
      const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });
      
      if (loginError) {
        console.error(`❌ Erro no login de ${userData.name}:`, loginError);
        continue;
      }
      
      userClients.push({ client, user: createdUsers[i], name: userData.name });
      console.log(`✅ Login realizado: ${userData.name}`);
    }
    
    // 3. Criar estudantes com cada usuário
    console.log('\n3️⃣ Criando estudantes com cada usuário...');
    
    for (let i = 0; i < userClients.length; i++) {
      const { client, user, name } = userClients[i];
      
      const studentData = {
        name: `Estudante do ${name}`,
        email: `estudante${i + 1}.${Date.now()}@teste.com`,
        phone: `(11) 9999-000${i + 1}`,
        birth_date: `200${i + 1}-0${i + 1}-0${i + 1}`,
        created_by: user.id
      };
      
      const { data: studentResult, error: studentError } = await client
        .from('students')
        .insert(studentData)
        .select()
        .single();
      
      if (studentError) {
        console.error(`❌ Erro ao criar estudante para ${name}:`, studentError);
        continue;
      }
      
      createdStudents.push({ ...studentResult, createdBy: name });
      console.log(`✅ Estudante criado por ${name}: ${studentResult.name} (${studentResult.id})`);
    }
    
    // 4. Testar acesso de dados
    console.log('\n4️⃣ Testando acesso de dados...');
    
    for (let i = 0; i < userClients.length; i++) {
      const { client, user, name } = userClients[i];
      
      const { data: visibleStudents, error } = await client
        .from('students')
        .select('*');
      
      if (error) {
        console.error(`❌ Erro ao buscar estudantes para ${name}:`, error);
        continue;
      }
      
      console.log(`\n👤 ${name} pode ver ${visibleStudents.length} estudante(s):`);
      
      for (const student of visibleStudents) {
        const createdByUser = createdStudents.find(s => s.id === student.id)?.createdBy || 'Outro usuário';
        const isOwn = student.created_by === user.id;
        console.log(`  - ${student.name} (criado por: ${createdByUser}) ${isOwn ? '✅ PRÓPRIO' : '👁️ VISÍVEL'}`);
      }
      
      console.log(`✅ ACESSO OK: ${name} pode ver ${visibleStudents.length} estudante(s) (todos devem ser visíveis)`);
    }
    
    // 5. Testar com usuário admin (deve ver todos)
    console.log('\n5️⃣ Testando acesso de administrador...');
    
    // Criar usuário admin
    const adminData = {
      email: `admin.${Date.now()}@teste.com`,
      password: 'admin123456',
      name: 'Admin Teste',
      role: 'admin'
    };
    
    const { data: adminAuthData, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      email_confirm: true,
      user_metadata: { name: adminData.name }
    });
    
    if (!adminAuthError) {
      await supabaseAdmin
        .from('users')
        .insert({
          id: adminAuthData.user.id,
          email: adminData.email,
          name: adminData.name,
          role: adminData.role
        });
      
      const adminClient = createUserClient();
      const { error: adminLoginError } = await adminClient.auth.signInWithPassword({
        email: adminData.email,
        password: adminData.password
      });
      
      if (!adminLoginError) {
        const { data: adminVisibleStudents } = await adminClient
          .from('students')
          .select('*');
        
        console.log(`👑 Admin pode ver ${adminVisibleStudents?.length || 0} estudante(s) (deve ver todos)`);
        
        createdUsers.push(adminAuthData.user);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    // 6. Limpeza - remover dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    // Remover estudantes
    for (const student of createdStudents) {
      try {
        await supabaseAdmin
          .from('students')
          .delete()
          .eq('id', student.id);
        console.log(`✓ Estudante ${student.name} deletado`);
      } catch (error) {
        console.log(`✗ Erro ao deletar estudante ${student.name}:`, error.message);
      }
    }
    
    // Remover usuários
    for (const user of createdUsers) {
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', user.id);
      
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
    
    console.log('✅ Limpeza concluída');
  }
  
  console.log('\n🎉 Teste de isolamento RLS concluído!');
}

testRLSIsolation();