'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  ArrowLeft, 
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
  XCircle
} from 'lucide-react';
import { Student, Anamnese, AnamneseWithRelations } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';


export default function StudentAnamnesesPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [anamneses, setAnamneses] = useState<AnamneseWithRelations[]>([]);
  const [filteredAnamneses, setFilteredAnamneses] = useState<AnamneseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');


  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, studentId, router]);

  useEffect(() => {
    let filtered = anamneses;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(anamnesis => 
        anamnesis.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anamnesis.notes || ""?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(anamnesis => anamnesis.status === statusFilter);
    }

    setFilteredAnamneses(filtered);
  }, [anamneses, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch student data
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Fetch anamneses
      const { data: anamnesesData, error: anamnesesError } = await supabase
        .from('anamneses')
        .select(`
          *,
          created_by_user:users!anamneses_created_by_fkey(name, email)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (anamnesesError) throw anamnesesError;
      setAnamneses(anamnesesData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              Aluno não encontrado.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/students')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Anamneses - {student.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Histórico de anamneses do aluno
            </p>
          </div>
          {hasPermission('create_anamnesis') && (
            <Button 
              onClick={() => router.push(`/anamneses/new?student_id=${studentId}`)}
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

        {/* Student Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  {student.email && <span>{student.email}</span>}
                  {student.phone && <span>{student.phone}</span>}
                  {student.birth_date && (
                    <span>Nascimento: {formatDate(student.birth_date)}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total de Anamneses</p>
                <p className="text-2xl font-bold text-gray-900">{anamneses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar anamneses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
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
            </div>
          </CardContent>
        </Card>

        {/* Anamneses List */}
        {filteredAnamneses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhuma anamnese encontrada' 
                  : 'Nenhuma anamnese cadastrada'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando a primeira anamnese para este aluno'
                }
              </p>
              {(!searchTerm && statusFilter === 'all') && hasPermission('create_anamnesis') && (
                <Button onClick={() => router.push(`/anamneses/new?student_id=${studentId}`)}>
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
                            {anamnesis.title || `Anamnese ${formatDate(anamnesis.created_at)}`}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        {anamnesis.notes && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {anamnesis.notes}
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
                                : anamnesis.status === 'completed' && new Date(anamnesis.expires_at) < new Date()
                                ? `Expira em ${daysUntilExpiration} dias`
                                : `Expira em ${daysUntilExpiration} dias`
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Criado por: {anamnesis.created_by_user?.name || 'Usuário não encontrado'}</span>
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
                        

                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        

      </div>
    </div>
  );
}