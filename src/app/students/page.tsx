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
  Edit, 
  Trash2, 
  FileText, 
  Users,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Clock,
  GraduationCap
} from 'lucide-react';
import { Student } from '@/types';
import { formatDate, calculateAge } from '@/lib/utils';

export default function StudentsPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [activeAnamnesesCount, setActiveAnamnesesCount] = useState(0);

  // Função para formatar os dias da semana salvos no banco
  const formatWeekdays = (weekdays: string) => {
    const weekdayMap: Record<string, string> = {
      'segunda-quarta': 'Segunda e Quarta',
      'segunda-quarta-sexta': 'Segunda, Quarta e Sexta',
      'terca-quinta': 'Terça e Quinta'
    };
    return weekdayMap[weekdays] || weekdays;
  };

  // Função para obter horário e dia da semana do aluno
  const getClassSchedule = (student: Student) => {
    // Priorizar dados salvos no banco
    if (student.schedule && student.weekdays) {
      return {
        time: student.schedule,
        weekday: formatWeekdays(student.weekdays)
      };
    }
    
    // Fallback: calcular baseado no class_group se não houver dados salvos
    const classGroup = student.class_group;
    if (!classGroup) return { time: '', weekday: '' };
    
    // Mapeamento baseado nas turmas reais do sistema
    const schedules: Record<string, { time: string; weekday: string }> = {
      // Turmas específicas encontradas no banco de dados
       'Turma A - Manhã': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
       'Turma 17': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      
      // Mapeamentos para turmas com padrão "Turma X - Período"
      'Turma A - Tarde': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      'Turma B - Manhã': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
      'Turma B - Tarde': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      'Turma C - Manhã': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
      'Turma C - Tarde': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      
      // Turmas numeradas (1-20)
      '1': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
      '2': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      '3': { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' },
      '4': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
      '5': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      '6': { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' },
      '7': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
      '8': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      '9': { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' },
      '10': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
      '11': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      '12': { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' },
      '13': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
      '14': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      '15': { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' },
      '16': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
      '17': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
      '18': { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' },
      '19': { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
      '20': { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
    };
    
    // Busca exata primeiro
    let schedule = schedules[classGroup];
    
    if (!schedule) {
      // Tenta extrair número da turma (ex: "Turma 17" -> "17")
      const numberMatch = classGroup.match(/\d+/);
      if (numberMatch) {
        const number = numberMatch[0];
        schedule = schedules[number];
      }
      
      // Se ainda não encontrou, verifica se contém "Manhã", "Tarde" ou "Noite"
      if (!schedule) {
        if (classGroup.toLowerCase().includes('manhã')) {
          schedule = { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' };
        } else if (classGroup.toLowerCase().includes('tarde')) {
          schedule = { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' };
        } else if (classGroup.toLowerCase().includes('noite')) {
          schedule = { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' };
        }
      }
    }
    
    // Fallback padrão baseado no hash do nome da turma para consistência
    if (!schedule) {
      const hash = classGroup.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const timeOptions = [
        { time: '08:00 - 12:00', weekday: 'Segunda a Sexta' },
        { time: '14:00 - 18:00', weekday: 'Segunda a Sexta' },
        { time: '19:00 - 22:00', weekday: 'Segunda a Sexta' }
      ];
      
      schedule = timeOptions[Math.abs(hash) % timeOptions.length];
    }
    
    return schedule;
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchStudents();
  }, [user, router]);

  useEffect(() => {
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone?.includes(searchTerm) ||
      student.cpf || ""?.includes(searchTerm)
    );
    setFilteredStudents(filtered);
  }, [students, searchTerm]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true }); // Ordenação alfabética por nome

      if (error) throw error;
      setStudents(data || []);
      
      // Buscar anamneses ativas
      await fetchActiveAnamneses();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estudantes');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveAnamneses = async () => {
    try {
      const { data, error } = await supabase
        .from('anamneses')
        .select('id')
        .eq('status', 'completed');

      if (error) throw error;
      setActiveAnamnesesCount(data?.length || 0);
    } catch (err: unknown) {
      console.error('Erro ao buscar anamneses ativas:', err instanceof Error ? err.message : 'Erro desconhecido');
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!hasPermission('delete_student')) {
      setError('Você não tem permissão para excluir alunos');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;
      
      setStudents(students.filter(s => s.id !== studentId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir estudante');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Voltar</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Alunos</h1>
              <p className="text-gray-600 mt-1 text-xs sm:text-base hidden sm:block">
                Gerencie os alunos cadastrados no sistema
              </p>
            </div>
          </div>
          {hasPermission('create_student') && (
            <Button 
              onClick={() => router.push('/students/new')}
              className="flex items-center gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sm:hidden">Novo Aluno</span>
              <span className="hidden sm:inline">Novo Aluno</span>
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Alunos</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{students.length}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Anamneses Ativas</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {activeAnamnesesCount}
                  </p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Cadastros Hoje</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {students.filter(s => 
                      new Date(s.created_at).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                type="text"
                placeholder="Buscar por nome, email, telefone ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 text-xs sm:text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-12 text-center">
              <Users className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
              </h3>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca'
                  : 'Comece cadastrando o primeiro aluno do sistema'
                }
              </p>
              {!searchTerm && hasPermission('create_student') && (
                <Button onClick={() => router.push('/students/new')} className="text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Cadastrar Primeiro Aluno
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredStudents.map((student) => {
              const schedule = getClassSchedule(student);
              return (
                <Card key={student.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {student.name}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : student.status === 'suspended'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student.status === 'active' ? 'Ativo' : student.status === 'suspended' ? 'Em Licença' : 'Inativo'}
                          </span>
                        </div>
                        
                        {/* Informações da turma, horário e dia da semana */}
                        {student.class_group && (
                          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 mb-3 text-xs sm:text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                              <span className="font-medium">{student.class_group}</span>
                            </div>
                            {schedule.time && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                <span>{schedule.time}</span>
                              </div>
                            )}
                            {schedule.weekday && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                                <span>{schedule.weekday}</span>
                              </div>
                            )}
                          </div>
                        )}
                      
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          {student.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="truncate">{student.email}</span>
                            </div>
                          )}
                          {student.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                          {student.birth_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{calculateAge(student.birth_date)} anos</span>
                            </div>
                          )}
                          {student.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="truncate">
                                {[student.address.street, student.address.number, student.address.neighborhood, student.address.city, student.address.state]
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 sm:mt-3 text-xs text-gray-500">
                          Cadastrado em {formatDate(student.created_at)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 sm:pt-0 sm:ml-4 border-t sm:border-t-0 border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/students/${student.id}/anamneses`)}
                          className="text-xs px-2 py-1 sm:px-3 sm:py-2"
                        >
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="ml-1 sm:hidden">Anamneses</span>
                        </Button>
                        {hasPermission('update_student') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/students/${student.id}/edit`)}
                            className="text-xs px-2 py-1 sm:px-3 sm:py-2"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="ml-1 sm:hidden">Editar</span>
                          </Button>
                        )}
                        {hasPermission('delete_student') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-2 py-1 sm:px-3 sm:py-2"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="ml-1 sm:hidden">Excluir</span>
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