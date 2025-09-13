import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { mockSupabase } from './supabase-mock';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

//// Verificar se as variáveis de ambiente estão configuradas
const isValidConfig = supabaseUrl && supabaseAnonKey;

// Cliente principal do Supabase
const supabase = isValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: typeof window !== 'undefined'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : mockSupabase as any;

// Flag para indicar se estamos usando mock
const isUsingMock = !isValidConfig;

// Exportações
export { supabase, isUsingMock };

// Função para verificar se o Supabase está configurado
export const isSupabaseConfigured = () => isValidConfig;

// Mensagem de aviso para desenvolvimento
if (!isValidConfig && typeof window !== 'undefined') {
  console.warn('⚠️ Supabase não configurado - usando dados mock para desenvolvimento');
  console.warn('Para usar o Supabase real, configure as variáveis de ambiente no arquivo .env.local');
}

// Cliente para operações administrativas (server-side)
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Tipos para facilitar o uso
export type SupabaseClient = typeof supabase;
export type { Database } from '@/types/database';

// Helpers para autenticação
export const auth = {
  signUp: async (email: string, password: string, userData: { name: string; role?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`
    });
    return { data, error };
  },

  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    });
    return { data, error };
  }
};

// Helpers para storage
export const storage = {
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
    return { data, error };
  },

  updateFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .update(path, file, {
        cacheControl: '3600',
        upsert: true
      });
    return { data, error };
  },

  deleteFile: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { data, error };
  },

  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  createSignedUrl: async (bucket: string, path: string, expiresIn: number = 3600) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    return { data, error };
  }
};

// Helpers para realtime
export const realtime = {
  subscribeToTable: (table: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe();
  },

  subscribeToUserNotifications: (userId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  },

  unsubscribe: (subscription: any) => {
    return supabase.removeChannel(subscription);
  }
};

// Helper para verificar conexão
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Helper para logs de auditoria
export const auditLog = {
  log: async (tableName: string, recordId: string, action: 'INSERT' | 'UPDATE' | 'DELETE', oldData?: any, newData?: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        table_name: tableName,
        record_id: recordId,
        action,
        old_data: oldData || null,
        new_data: newData || null,
        user_id: user?.id || null
      });
    
    if (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  }
};