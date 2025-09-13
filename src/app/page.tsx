'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Anamnese Hidroginástica
        </h1>
        <p className="text-gray-600 mb-8">
          Sistema de gestão de anamneses para hidroginástica
        </p>
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Carregando...</span>
        </div>
      </div>
    </div>
  );
}