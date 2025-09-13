'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User as AppUser, UserProfile } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (userData: Partial<UserProfile>) => Promise<{ error?: string }>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isCoordenador: boolean;
  isProfessor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// Função para traduzir mensagens de erro do Supabase
const translateSupabaseError = (errorMessage: string): string => {
  const translations: { [key: string]: string } = {
    'Invalid login credentials': 'Credenciais de login inválidas',
    'Email not confirmed': 'E-mail não confirmado',
    'User already registered': 'Usuário já cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Unable to validate email address: invalid format': 'Formato de e-mail inválido',
    'Email rate limit exceeded': 'Limite de tentativas de e-mail excedido',
  };
  
  return translations[errorMessage] || errorMessage;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Se o perfil não for encontrado, fazer logout para limpar a sessão inválida
        if (error.code === 'PGRST116') {
          console.log('Perfil não encontrado, fazendo logout automático...');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        }
        return;
      }

      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Em caso de erro inesperado, também fazer logout
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: translateSupabaseError(error.message) };
      }

      return {};
    } catch (error) {
      return { error: 'Erro inesperado ao fazer login' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      
      // Use API route for registration
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Erro ao criar conta' };
      }

      return {};
    } catch (error) {
      console.error('Erro no registro:', error);
      return { error: 'Erro inesperado ao criar conta' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
      });

      if (error) {
        return { error: translateSupabaseError(error.message) };
      }

      return {};
    } catch (error) {
      return { error: 'Erro inesperado ao redefinir senha' };
    }
  };

  const updateProfile = async (userData: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: 'Usuário não autenticado' };
      }

      const { error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          phone: userData.phone,
          department: userData.department,
          specialization: userData.specialization,
          avatar_url: userData.avatar_url,
        })
        .eq('id', user.id);

      if (error) {
        return { error: 'Erro ao atualizar perfil' };
      }

      // Update local user state
      setUser({ ...user, ...userData });
      return {};
    } catch (error) {
      return { error: 'Erro inesperado ao atualizar perfil' };
    }
  };

  // Permission system
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions = {
      admin: [
        'manage_users',
        'manage_students',
        'create_student',
        'read_student',
        'update_student',
        'delete_student',
        'manage_anamneses',
        'create_anamnesis',
        'read_anamnesis',
        'update_anamnesis',
        'delete_anamnesis',
        'view_reports',
        'system_settings',
      ],
      coordenador: [
        'manage_students',
        'create_student',
        'read_student',
        'update_student',
        'delete_student',
        'manage_anamneses',
        'create_anamnesis',
        'read_anamnesis',
        'update_anamnesis',
        'delete_anamnesis',
        'view_reports',
      ],
      professor: [
        'manage_students',
        'create_student',
        'read_student',
        'update_student',
        'manage_anamneses',
        'create_anamnesis',
        'read_anamnesis',
        'update_anamnesis',
      ],
    };

    return permissions[user.role]?.includes(permission) || false;
  };

  const isAdmin = user?.role === 'admin';
  const isCoordenador = user?.role === 'coordenador';
  const isProfessor = user?.role === 'professor';

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    hasPermission,
    isAdmin,
    isCoordenador,
    isProfessor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Acesso Negado
            </h1>
            <p className="text-gray-600">
              Você precisa estar logado para acessar esta página.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Hook for role-based access
export function useRoleAccess(requiredRole: 'admin' | 'coordenador' | 'professor') {
  const { user } = useAuth();

  const roleHierarchy = {
    admin: 3,
    coordenador: 2,
    professor: 1,
  };

  const hasAccess = user && roleHierarchy[user.role] >= roleHierarchy[requiredRole];

  return { hasAccess, userRole: user?.role };
}