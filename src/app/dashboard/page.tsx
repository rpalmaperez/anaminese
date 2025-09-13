'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, withAuth } from '@/contexts/AuthContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { supabase } from '@/lib/supabase';
import { Student, Anamnese } from '@/types';
import { formatDateTime } from '@/lib/utils';
import AppLayout from '@/components/AppLayout';

import SyncStatus from '@/components/SyncStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Search,
  Bell,
  Activity,
  Clock,
  History
} from 'lucide-react';

function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { isOnline, getCachedData, cacheData } = useOfflineSync();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeAnamneses: 0,
    expiredAnamneses: 0,
    expiringAnamneses: 0
  });
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const [allAnamneses, setAllAnamneses] = useState<Anamnese[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      let studentsData: Student[] = [];
      let anamnesisData: Anamnese[] = [];
      
      if (isOnline) {
        // Load from server
        const [studentsResponse, anamnesisResponse] = await Promise.all([
          supabase.from('students').select('*'),
          supabase.from('anamneses').select(`
            *,
            student:students(*),
            created_by_user:users(*)
          `)
        ]);
        
        if (studentsResponse.error) throw studentsResponse.error;
        if (anamnesisResponse.error) throw anamnesisResponse.error;
        
        studentsData = studentsResponse.data || [];
        anamnesisData = anamnesisResponse.data || [];
        
        // Cache data for offline use
        await cacheData(anamnesisData, studentsData);
      } else {
        // Load from cache
        const cachedData = getCachedData();
        studentsData = cachedData.students;
        anamnesisData = cachedData.anamneses;
      }
      
      // Calculate statistics
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const activeAnamneses = anamnesisData.filter(a => a.status === 'completed').length;
      const expiredAnamneses = anamnesisData.filter(a => a.status === 'expired').length;
      const expiringAnamneses = anamnesisData.filter(a => {
        if (a.status !== 'completed' || !a.expires_at) return false;
        const expiresAt = new Date(a.expires_at);
        return expiresAt <= thirtyDaysFromNow && expiresAt > now;
      }).length;
      
      setStats({
        totalStudents: studentsData.length,
        activeAnamneses,
        expiredAnamneses,
        expiringAnamneses
      });
      
      // Recent activities (last 10 anamneses)
      const recentAnamneses = anamnesisData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(anamnesis => ({
          id: anamnesis.id,
          type: 'anamnesis',
          description: anamnesis.title || `Anamnese ${new Date(anamnesis.created_at).toLocaleDateString('pt-BR')}` || 'Anamnese sem titulo',
          timestamp: anamnesis.created_at,
          user: anamnesis.created_by || 'Usuário não encontrado'
        }));
      
      setRecentActivities(recentAnamneses);
      setAllAnamneses(anamnesisData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [isOnline, getCachedData, cacheData]);
  
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bem-vindo, {user?.name}!
            </h2>
            <p className="text-gray-600">
              Aqui esta um resumo das suas atividades recentes.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSyncDetails(!showSyncDetails)}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Status
            </Button>

          </div>
        </div>
        
        {/* Sync Status */}
        {showSyncDetails && (
          <SyncStatus showDetails={true} className="mb-6" />
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Alunos
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalStudents}
              </div>
              <p className="text-xs text-gray-500">
                {!isOnline && '(Dados offline)'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Anamneses Ativas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.activeAnamneses}
              </div>
              <p className="text-xs text-gray-500">
                {!isOnline && '(Dados offline)'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expirando em Breve
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.expiringAnamneses}
              </div>
              <p className="text-xs text-gray-500">
                Proximos 30 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Anamneses Expiradas
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.expiredAnamneses}
              </div>
              <p className="text-xs text-gray-500">
                {stats.expiredAnamneses > 0 ? 'Requerem atencao' : 'Nenhuma expirada'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesse rapidamente as funcionalidades mais utilizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push('/students/new')}
                >
                  <Users className="h-6 w-6 text-blue-600" />
                  <span>Cadastrar Aluno</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push('/anamneses/new')}
                >
                  <FileText className="h-6 w-6 text-green-600" />
                  <span>Nova Anamnese</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push('/students')}
                >
                  <Search className="h-6 w-6 text-orange-600" />
                  <span>Buscar Alunos</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                  onClick={() => router.push('/history')}
                >
                  <History className="h-6 w-6 text-purple-600" />
                  <span>Histórico</span>
                </Button>

              </div>
            </CardContent>
          </Card>


        </div>


        

      </div>
    </AppLayout>
  );
}

export default withAuth(DashboardPage);