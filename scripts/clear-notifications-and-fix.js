const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearNotificationsAndFix() {
  try {
    console.log('🔄 Limpando notifications e corrigindo professor1...');
    
    // 1. Limpar a tabela notifications
    console.log('\n🗑️ Limpando tabela notifications...');
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (deleteError) {
      console.error('❌ Erro ao limpar tabela notifications:', deleteError);
    } else {
      console.log('✅ Tabela notifications limpa com sucesso');
    }
    
    // 2. Atualizar o professor1
    console.log('\n🔄 Atualizando professor1...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ id: '40209292-c9ae-4b0a-b15e-1ad45e2ab050' })
      .eq('email', 'professor1@hidroginastica.com');
    
    if (updateError) {
      console.error('❌ Erro ao atualizar professor1:', updateError);
    } else {
      console.log('✅ Professor1 atualizado com sucesso');
    }
    
    console.log('\n✅ Correção concluída!');
    
    // 3. Verificar o resultado final
    console.log('\n🔍 Verificando resultado final...');
    
    // Listar usuários de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Erro ao listar usuários de auth:', authError);
    } else {
      console.log('\n📋 Usuários de autenticação:');
      authUsers.users.forEach(user => {
        console.log(`- ${user.email}: ${user.id}`);
      });
    }
    
    // Listar usuários da tabela
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .order('email');
    
    if (dbError) {
      console.error('❌ Erro ao listar usuários da tabela:', dbError);
    } else {
      console.log('\n📋 Usuários na tabela users:');
      dbUsers.forEach(user => {
        console.log(`- ${user.email}: ${user.id} (${user.role})`);
      });
    }
    
    // Verificar correspondências
    console.log('\n🔍 Verificando correspondências:');
    
    let allMatch = true;
    authUsers.users.forEach(authUser => {
      const dbUser = dbUsers.find(u => u.id === authUser.id);
      if (dbUser) {
        console.log(`✅ ${authUser.email} -> ${dbUser.name} (${dbUser.role})`);
      } else {
        console.log(`❌ ${authUser.email} (${authUser.id}) não encontrado na tabela users`);
        allMatch = false;
      }
    });
    
    if (allMatch) {
      console.log('\n🎉 SUCESSO! Todos os usuários estão sincronizados corretamente!');
      console.log('\n📝 Credenciais de teste:');
      console.log('Admin: admin@hidroginastica.com / admin123');
      console.log('Coordenador: coordenador@hidroginastica.com / coordenador123');
      console.log('Professor 1: professor1@hidroginastica.com / professor123');
      console.log('Professor 2: professor2@hidroginastica.com / professor123');
      console.log('\n🚀 A aplicação agora deve funcionar corretamente!');
    } else {
      console.log('\n⚠️ Ainda há usuários não sincronizados.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
  }
}

clearNotificationsAndFix();