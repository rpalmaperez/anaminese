import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Cliente anônimo para auth
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, userData } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Criar usuário de autenticação
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Erro na criação do usuário de auth:', authError);
      return NextResponse.json(
        { error: translateSupabaseError(authError.message) },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Falha ao criar usuário' },
        { status: 500 }
      );
    }

    // 2. Criar perfil do usuário usando service role
    const profileData = {
      id: authData.user.id,
      email,
      name: userData?.name || '',
      role: userData?.role || 'professor',
      phone: userData?.phone,
      department: userData?.department,
      specialization: userData?.specialization,
    };

    const { data: profileResult, error: profileError } = await supabaseAdmin
      .from('users')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      
      // Tentar limpar o usuário de auth criado
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Erro ao limpar usuário de auth:', cleanupError);
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar perfil do usuário' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Usuário criado com sucesso',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          ...profileResult
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro inesperado no registro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para traduzir erros do Supabase
function translateSupabaseError(errorMessage: string): string {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'Credenciais de login inválidas',
    'Email not confirmed': 'E-mail não confirmado',
    'User already registered': 'Usuário já cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Unable to validate email address: invalid format': 'Formato de e-mail inválido',
    'Email rate limit exceeded': 'Limite de tentativas de e-mail excedido',
  };
  
  return translations[errorMessage] || errorMessage;
}