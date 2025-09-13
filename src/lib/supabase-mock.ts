// Mock do Supabase para desenvolvimento
export const mockSupabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => {
          if (table === 'users' && column === 'id' && value === 'mock-user-id') {
            return Promise.resolve({ 
              data: {
                id: 'mock-user-id',
                email: 'admin@hidroginastica.com',
                name: 'Administrador Sistema',
                role: 'admin',
                department: 'Administração',
                specialization: 'Gestão',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, 
              error: null 
            });
          }
          return Promise.resolve({ data: null, error: null });
        },
        then: (callback: any) => callback({ data: [], error: null })
      }),
      order: (column: string, options?: any) => ({
        then: (callback: any) => callback({ data: [], error: null })
      }),
      then: (callback: any) => callback({ data: [], error: null })
    }),
    insert: (data: any) => ({
      select: (columns?: string) => ({
        single: () => Promise.resolve({ data: null, error: null }),
        then: (callback: any) => callback({ data: null, error: null })
      }),
      then: (callback: any) => callback({ data: null, error: null })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          then: (callback: any) => callback({ data: null, error: null })
        }),
        then: (callback: any) => callback({ data: null, error: null })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: (callback: any) => callback({ data: null, error: null })
      })
    })
  }),
  auth: {
    getUser: () => Promise.resolve({ 
      data: { 
        user: {
          id: 'mock-user-id',
          email: 'admin@hidroginastica.com',
          user_metadata: { name: 'Administrador Sistema' }
        } 
      }, 
      error: null 
    }),
    getSession: () => {
      console.log('Mock: getSession called');
      return Promise.resolve({ 
        data: { 
          session: {
            user: {
              id: 'mock-user-id',
              email: 'admin@hidroginastica.com',
              user_metadata: { name: 'Administrador Sistema' }
            },
            access_token: 'mock-token'
          } 
        }, 
        error: null 
      });
    },
    signInWithPassword: (credentials: any) => {
      console.log('Mock: signInWithPassword called with:', credentials.email);
      return Promise.resolve({ 
        data: { 
          user: {
            id: 'mock-user-id',
            email: credentials.email,
            user_metadata: { name: 'Usuário Mock' }
          }, 
          session: {
            user: {
              id: 'mock-user-id',
              email: credentials.email,
              user_metadata: { name: 'Usuário Mock' }
            },
            access_token: 'mock-token'
          }
        }, 
        error: null 
      });
    },
    signUp: (credentials: any) => Promise.resolve({ 
      data: { user: null, session: null }, 
      error: { message: 'Mock: Cadastro não implementado' } 
    }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: any) => {
      // Mock subscription
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  },
  storage: {
    from: (bucket: string) => ({
      upload: (path: string, file: any) => Promise.resolve({ 
        data: null, 
        error: { message: 'Mock: Storage não configurado' } 
      }),
      getPublicUrl: (path: string) => ({ 
        data: { publicUrl: '#' } 
      })
    })
  }
};