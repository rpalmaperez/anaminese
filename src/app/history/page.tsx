'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  Eye, 

  AlertCircle,
  Clock,
  TrendingUp,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { Anamnese, Student, User as UserType } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';

interface AnamneseWithRelations extends Anamnese {
  student: {
    id: string;
    name: string;
    email?: string;
  };
  created_by_user: {
    id: string;
    name: string;
    email: string;
  };
  updated_by_user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface HistoryStats {
  total_anamneses: number;
  this_month: number;
  last_month: number;
  active_count: number;
  expired_count: number;
  draft_count: number;
}

export default function HistoryPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  
  const [anamneses, setAnamneses] = useState<AnamneseWithRelations[]>([]);
  const [filteredAnamneses, setFilteredAnamneses] = useState<AnamneseWithRelations[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasPermission('read_anamnesis')) {
      router.push('/dashboard');
      return;
    }
    
    fetchData();
  }, [user, router, hasPermission]);

  useEffect(() => {
    applyFilters();
  }, [anamneses, searchTerm, selectedStudent, selectedStatus, selectedCreator, dateFrom, dateTo, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAnamneses(),
        fetchStudents(),
        fetchUsers(),
        fetchStats()
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnamneses = async () => {
    const { data, error } = await supabase
      .from('anamneses')
      .select(`
        *,
        student:students!anamneses_student_id_fkey(id, name, email),
        created_by_user:users!anamneses_created_by_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    setAnamneses(data || []);
  };

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, email')
      .order('name');

    if (error) throw error;
    setStudents(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .order('name');

    if (error) throw error;
    setUsers(data || []);
  };

  const fetchStats = async () => {
    try {
      // Get total count
      const { count: totalCount } = await supabase
        .from('anamneses')
        .select('*', { count: 'exact', head: true });

      // Get this month count
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      
      const { count: thisMonthCount } = await supabase
        .from('anamneses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonthStart.toISOString());

      // Get last month count
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
      lastMonthStart.setDate(1);
      lastMonthStart.setHours(0, 0, 0, 0);
      
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      
      const { count: lastMonthCount } = await supabase
        .from('anamneses')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      // Get status counts
      const { count: activeCount } = await supabase
        .from('anamneses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: expiredCount } = await supabase
        .from('anamneses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'expired');

      const { count: draftCount } = await supabase
        .from('anamneses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      setStats({
        total_anamneses: totalCount || 0,
        this_month: thisMonthCount || 0,
        last_month: lastMonthCount || 0,
        active_count: activeCount || 0,
        expired_count: expiredCount || 0,
        draft_count: draftCount || 0
      });
    } catch (err: any) {
      console.error('Error fetching stats:', err.message);
    }
  };

  const applyFilters = () => {
    let filtered = [...anamneses];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(anamnesis => 
        anamnesis.title || `Anamnese ${formatDate(anamnesis.created_at)}`?.toLowerCase().includes(term) ||
        anamnesis.student.name.toLowerCase().includes(term) ||
        anamnesis.notes || ""?.toLowerCase().includes(term)
      );
    }

    // Student filter
    if (selectedStudent) {
      filtered = filtered.filter(anamnesis => anamnesis.student_id === selectedStudent);
    }

    // Status filter
    if (selectedStatus) {
      filtered = filtered.filter(anamnesis => anamnesis.status === selectedStatus);
    }

    // Creator filter
    if (selectedCreator) {
      filtered = filtered.filter(anamnesis => anamnesis.created_by === selectedCreator);
    }

    // Date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(anamnesis => new Date(anamnesis.created_at) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(anamnesis => new Date(anamnesis.created_at) <= toDate);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'student_name':
          aValue = a.student.name;
          bValue = b.student.name;
          break;
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredAnamneses(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStudent('');
    setSelectedStatus('');
    setSelectedCreator('');
    setDateFrom('');
    setDateTo('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'active':
        return 'Ativa';
      case 'expired':
        return 'Expirada';
      case 'draft':
        return 'Rascunho';
      default:
        return status;
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Histórico de Anamneses</h1>
            <p className="text-gray-600 mt-1">
              Visualize e gerencie o histórico completo de anamneses
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
            {/* Botão de exportação removido */}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Anamneses</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_anamneses}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Este Mês</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.this_month}</p>
                    {stats.last_month > 0 && (
                      <p className="text-xs text-gray-500">
                        {stats.this_month > stats.last_month ? '+' : ''}
                        {((stats.this_month - stats.last_month) / stats.last_month * 100).toFixed(1)}% vs mês anterior
                      </p>
                    )}
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ativas</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active_count}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expiradas</p>
                    <p className="text-2xl font-bold text-red-600">{stats.expired_count}</p>
                  </div>
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Buscar por título, aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aluno
                </label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os alunos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os alunos</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os status</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criado por
                </label>
                <Select value={selectedCreator} onValueChange={setSelectedCreator}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os usuários</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data inicial
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data final
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenar por
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Data de criação</SelectItem>
                    <SelectItem value="title">Título</SelectItem>
                    <SelectItem value="student_name">Nome do aluno</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordem
                </label>
                <Select value={sortOrder} onValueChange={(value: string) => setSortOrder(value as 'asc' | 'desc')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Decrescente</SelectItem>
                    <SelectItem value="asc">Crescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Histórico ({filteredAnamneses.length} registros)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAnamneses.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma anamnese encontrada com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Data</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Título</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Aluno</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Criado por</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Última atualização</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnamneses.map((anamnesis) => (
                      <tr key={anamnesis.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">
                              {formatDate(anamnesis.created_at)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">
                            {anamnesis.title || `Anamnese ${formatDate(anamnesis.created_at)}` || 'Sem título'}
                          </p>
                          {anamnesis.notes && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {anamnesis.notes || ""}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{anamnesis.student.name}</p>
                              {anamnesis.student.email && (
                                <p className="text-sm text-gray-500">{anamnesis.student.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(anamnesis.status)}`}>
                            {getStatusLabel(anamnesis.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900">{anamnesis.created_by_user.name}</p>
                          <p className="text-xs text-gray-500">{anamnesis.created_by_user.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-900">
                            {anamnesis.updated_at ? formatDateTime(anamnesis.updated_at) : 'Nunca'}
                          </p>
                          {anamnesis.updated_by_user && (
                            <p className="text-xs text-gray-500">
                              por {anamnesis.updated_by_user.name}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/anamneses/${anamnesis.id}`)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              Ver
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}