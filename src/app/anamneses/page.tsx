'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar,
  Clock,
  User,
  Eye,
  Edit,

  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  ArrowLeft,
  Trash2
} from 'lucide-react';
import { Anamnese, AnamneseWithRelations } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';


export default function AnamnesesPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [anamneses, setAnamneses] = useState<AnamneseWithRelations[]>([]);
  const [filteredAnamneses, setFilteredAnamneses] = useState<AnamneseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; anamnesis: AnamneseWithRelations | null }>({ show: false, anamnesis: null });
  const [deleting, setDeleting] = useState(false);



  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchAnamneses();
  }, [user, router]);

  useEffect(() => {
    let filtered = anamneses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(anamnesis => 
        anamnesis.title || `Anamnese ${formatDate(anamnesis.created_at)}`?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anamnesis.notes || ""?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anamnesis.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anamnesis.student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(anamnesis => anamnesis.status === statusFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(anamnesis => 
            new Date(anamnesis.created_at).toDateString() === now.toDateString()
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(anamnesis => 
            new Date(anamnesis.created_at) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(anamnesis => 
            new Date(anamnesis.created_at) >= filterDate
          );
          break;
      }
    }

    setFilteredAnamneses(filtered);
  }, [anamneses, searchTerm, statusFilter, dateFilter]);

  const fetchAnamneses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anamneses')
        .select(`
          *,
          student:students!anamneses_student_id_fkey(id, name, email),
          created_by_user:users!anamneses_created_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnamneses(data || []);
    } catch (err: unknown) {
      console.error('Erro ao carregar anamneses:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar anamneses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnamnesis = async () => {
    if (!deleteConfirm.anamnesis) return;
    
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('anamneses')
        .delete()
        .eq('id', deleteConfirm.anamnesis.id);

      if (error) throw error;

      // Remove from local state
      setAnamneses(prev => prev.filter(a => a.id !== deleteConfirm.anamnesis!.id));
      setDeleteConfirm({ show: false, anamnesis: null });
    } catch (err: unknown) {
      console.error('Erro ao excluir anamnese:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir anamnese');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Rascunho',
          color: 'bg-gray-100 text-gray-800',
          icon: Edit
        };
      case 'completed':
        return {
          label: 'Concluída',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        };
      case 'active':
        return {
          label: 'Ativa',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        };
      case 'expired':
        return {
          label: 'Expirada',
          color: 'bg-red-100 text-red-800',
          icon: XCircle
        };
      case 'expiring_soon':
        return {
          label: 'Expirando',
          color: 'bg-yellow-100 text-yellow-800',
          icon: AlertTriangle
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: FileText
        };
    }
  };

  const getExpirationDate = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiration = new Date(created);
    expiration.setFullYear(expiration.getFullYear() + 1);
    return expiration;
  };

  const getDaysUntilExpiration = (createdAt: string) => {
    const expiration = getExpirationDate(createdAt);
    const today = new Date();
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStats = () => {
    const total = anamneses.length;
    const active = anamneses.filter(a => a.status === 'completed').length;
    const expiring = anamneses.filter(a => a.status === 'completed' && a.expires_at && new Date(a.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length;
    const expired = anamneses.filter(a => a.status === 'expired').length;
    const drafts = anamneses.filter(a => a.status === 'draft').length;
    
    return { total, active, expiring, expired, drafts };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Anamneses</h1>
              <p className="text-gray-600 mt-1">
                Gerencie todas as anamneses do sistema
              </p>
            </div>
          </div>
          {hasPermission('create_anamnesis') && (
            <Button 
              onClick={() => router.push('/anamneses/new')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Anamnese
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ativas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expirando</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiradas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rascunhos</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.drafts}</p>
                </div>
                <Edit className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por título, aluno, observações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-full lg:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="draft">Rascunho</option>
                    <option value="completed">Concluída</option>
                    <option value="expiring_soon">Expirando</option>
                    <option value="expired">Expirada</option>
                  </select>
                </div>
                
                <div className="w-full lg:w-48">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todas as Datas</option>
                    <option value="today">Hoje</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mês</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anamneses List */}
        {filteredAnamneses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Nenhuma anamnese encontrada' 
                  : 'Nenhuma anamnese cadastrada'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando a primeira anamnese do sistema'
                }
              </p>
              {(!searchTerm && statusFilter === 'all' && dateFilter === 'all') && hasPermission('create_anamnesis') && (
                <Button onClick={() => router.push('/anamneses/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Anamnese
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAnamneses.map((anamnesis) => {
              const statusInfo = getStatusInfo(anamnesis.status);
              const StatusIcon = statusInfo.icon;
              const daysUntilExpiration = getDaysUntilExpiration(anamnesis.created_at);
              
              return (
                <Card key={anamnesis.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {anamnesis.title || `Anamnese ${formatDate(anamnesis.created_at)}` || `Anamnese ${formatDate(anamnesis.created_at)}`}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {anamnesis.student.name}
                          </span>
                          {anamnesis.student.email && (
                            <span className="text-sm text-gray-600">
                              ({anamnesis.student.email})
                            </span>
                          )}
                        </div>
                        
                        {anamnesis.notes && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {anamnesis.notes || ""}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Criada em {formatDate(anamnesis.created_at)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {anamnesis.status === 'expired' 
                                ? 'Expirou'
                                : anamnesis.status === 'completed' && anamnesis.expires_at && new Date(anamnesis.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                                ? `Expira em ${daysUntilExpiration} dias`
                                : `Expira em ${daysUntilExpiration} dias`
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Por {anamnesis.created_by_user.name}</span>
                          </div>
                        </div>
                        
                        {anamnesis.updated_at && anamnesis.updated_at !== anamnesis.created_at && (
                          <div className="mt-2 text-xs text-gray-500">
                            Última atualização: {formatDateTime(anamnesis.updated_at)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/anamneses/${anamnesis.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {hasPermission('update_anamnesis') && anamnesis.status !== 'expired' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/anamneses/${anamnesis.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        

                        
                        {hasPermission('delete_anamnesis') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfirm({ show: true, anamnesis })}
                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmar Exclusão
              </h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir a anamnese "{deleteConfirm.anamnesis?.title || `Anamnese ${formatDate(deleteConfirm.anamnesis?.created_at || '')}` || 'esta anamnese'}"?
                <br /><br />
                <strong>Esta ação não pode ser desfeita.</strong>
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm({ show: false, anamnesis: null })}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDeleteAnamnesis}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}