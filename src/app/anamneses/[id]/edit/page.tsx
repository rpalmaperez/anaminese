'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  ArrowLeft, 
  Save, 
  User, 
  FileText, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Student, Anamnese, AnamneseWithStudent } from '@/types';
import { validatePhone, formatPhone } from '@/lib/utils';

interface FormData {
  student_id: string;
  title: string; // Mantido para compatibilidade com o formulário
  notes: string; // Mantido para compatibilidade com o formulário
  status: string;
  
  // Histórico médico
  medical_conditions: string;
  medications: string;
  allergies: string;
  surgeries: string;
  hospitalizations: string;
  
  // Histórico familiar
  family_medical_history: string;
  
  // Estilo de vida
  physical_activity: string;
  diet_type: string;
  sleep_quality: string;
  smoking_habits: string;
  alcohol_consumption: string;
  


  // Exames
  recent_exams: string;
  exam_results: string;

  // Observações adicionais
  additional_notes: string;
}

export default function EditAnamnesePage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formData, setFormData] = useState<FormData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasPermission('update_anamnesis')) {
      router.push('/dashboard');
      return;
    }
    
    if (id) {
      fetchAnamnese();
      fetchStudents();
    }
  }, [user, router, hasPermission, id]);

  const fetchAnamnese = async () => {
    try {
      const { data, error } = await supabase
        .from('anamneses')
        .select(`
          *,
          student:students!anamneses_student_id_fkey(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const anamnesis = data as AnamneseWithStudent;
      
      setFormData({
        student_id: anamnesis.student_id,
        title: anamnesis.title || '', // Campo pode não existir
        notes: anamnesis.notes || '', // Campo pode não existir
        status: anamnesis.status,
        medical_conditions: anamnesis.medical_history?.other_conditions || '',
        medications: Array.isArray(anamnesis.current_medications) ? anamnesis.current_medications.map((m: any) => {
          if (typeof m === 'string') return m;
          return `${m.name || ''} - ${m.dosage || ''}`;
        }).join(', ') : (typeof anamnesis.current_medications === 'string' ? anamnesis.current_medications : ''),
        allergies: Array.isArray(anamnesis.allergies) ? anamnesis.allergies.join(', ') : (typeof anamnesis.allergies === 'string' ? anamnesis.allergies : ''),
        surgeries: Array.isArray(anamnesis.medical_history?.surgeries) ? anamnesis.medical_history.surgeries.join(', ') : (typeof anamnesis.medical_history?.surgeries === 'string' ? anamnesis.medical_history.surgeries : ''),
        hospitalizations: Array.isArray(anamnesis.medical_history?.hospitalizations) ? anamnesis.medical_history.hospitalizations.join(', ') : (typeof anamnesis.medical_history?.hospitalizations === 'string' ? anamnesis.medical_history.hospitalizations : ''),
        family_medical_history: Array.isArray(anamnesis.medical_history?.family_history) ? anamnesis.medical_history.family_history.join(', ') : (typeof anamnesis.medical_history?.family_history === 'string' ? anamnesis.medical_history.family_history : ''),
        physical_activity: Array.isArray(anamnesis.lifestyle_habits?.physical_activity?.types) ? anamnesis.lifestyle_habits.physical_activity.types.join(', ') : '',
        diet_type: anamnesis.lifestyle_habits?.diet?.type || '',
        sleep_quality: anamnesis.lifestyle_habits?.sleep?.quality || '',
        smoking_habits: anamnesis.lifestyle_habits?.smoking?.status || '',
        alcohol_consumption: anamnesis.lifestyle_habits?.alcohol?.frequency || '',

        recent_exams: anamnesis.recent_exams || '',
        exam_results: anamnesis.exam_results || '',
        additional_notes: anamnesis.additional_notes || ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      console.error('Error fetching students:', err.message);
    }
  };

  const validateForm = (): boolean => {
    if (!formData) return false;
    
    const newErrors: Record<string, string> = {};

    if (!formData.student_id) {
      newErrors.student_id = 'Selecione um aluno';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    if (!formData) return;
    
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhoneChange = (field: keyof FormData, value: string) => {
    const formatted = formatPhone(value);
    handleInputChange(field, formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData || !validateForm()) {
      setError('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const anamnesisData = {
        student_id: formData.student_id,
        status: formData.status,
        medical_history: {
          other_conditions: formData.medical_conditions,
          surgeries: formData.surgeries ? formData.surgeries.split(', ').filter(s => s.trim()) : [],
          hospitalizations: formData.hospitalizations ? formData.hospitalizations.split(', ').filter(h => h.trim()) : [],
          family_history: formData.family_medical_history ? formData.family_medical_history.split(', ').filter(f => f.trim()) : []
        },
        current_medications: formData.medications ? formData.medications.split(', ').map(med => {
          const parts = med.split(' - ');
          return { name: parts[0]?.trim() || med.trim(), dosage: parts[1]?.trim() || '' };
        }).filter(m => m.name) : [],
        allergies: formData.allergies ? formData.allergies.split(', ').filter(a => a.trim()) : [],
        physical_limitations: [], // Não há dados no formulário atual
        lifestyle_habits: {
          physical_activity: {
            types: formData.physical_activity ? formData.physical_activity.split(', ').filter(p => p.trim()) : [],
            frequency: '',
            duration: ''
          },
          diet: {
            type: formData.diet_type as 'omnivore' | 'vegetarian' | 'vegan' | 'other' || 'omnivore',
            restrictions: [],
            supplements: []
          },
          sleep: {
            hours_per_night: 8,
            quality: formData.sleep_quality as 'poor' | 'fair' | 'good' | 'excellent' || 'good',
            sleep_disorders: []
          },
          smoking: {
            status: formData.smoking_habits || '',
            frequency: '',
            duration: ''
          },
          alcohol: {
            frequency: formData.alcohol_consumption || '',
            type: '',
            quantity: ''
          }
        },
        objectives: {
          primary: '',
          secondary: [],
          expectations: ''
        },

        recent_exams: formData.recent_exams || '',
        exam_results: formData.exam_results || '',
        additional_notes: formData.additional_notes || '',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('anamneses')
        .update(anamnesisData)
        .eq('id', id);

      if (error) throw error;

      setSuccess('Anamnese atualizada com sucesso!');
      setTimeout(() => {
        router.push(`/anamneses/${id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Anamnese não encontrada'}
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/anamneses')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Anamneses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/anamneses/${id}`)}
            className="flex items-center gap-2 text-xs sm:text-sm py-2 sm:py-2.5"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Editar Anamnese</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Atualize as informações da anamnese
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 sm:mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-xs sm:text-sm">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Aluno *
                  </label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => handleInputChange('student_id', value)}
                  >
                    <SelectTrigger className={`text-xs sm:text-sm ${errors.student_id ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Selecione um aluno">
                        {formData.student_id && students.length > 0 ? (
                          (() => {
                            const selectedStudent = students.find(s => s.id === formData.student_id);
                            return selectedStudent ? `${selectedStudent.name} ${selectedStudent.email ? `(${selectedStudent.email})` : ''}` : 'Selecione um aluno';
                          })()
                        ) : 'Selecione um aluno'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id} className="text-xs sm:text-sm">
                          {student.name} {student.email && `(${student.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.student_id && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.student_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Título *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Anamnese Inicial - Janeiro 2024"
                    error={errors.title}
                    className="text-xs sm:text-sm"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Status *
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="text-xs sm:text-sm">
                      <SelectValue>
                        {formData.status === 'draft' && 'Rascunho'}
                        {formData.status === 'completed' && 'Concluída'}
                        {formData.status === 'expired' && 'Expirada'}
                        {!formData.status && 'Selecione o status'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft" className="text-xs sm:text-sm">Rascunho</SelectItem>
                      <SelectItem value="completed" className="text-xs sm:text-sm">Concluída</SelectItem>
                      <SelectItem value="expired" className="text-xs sm:text-sm">Expirada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Observações Gerais
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações gerais sobre a anamnese..."
                  rows={3}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Histórico Médico */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Histórico Médico</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Condições Médicas
                </label>
                <textarea
                  value={formData.medical_conditions}
                  onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                  placeholder="Descreva condições médicas existentes..."
                  rows={3}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Medicamentos em Uso
                  </label>
                  <textarea
                    value={formData.medications}
                    onChange={(e) => handleInputChange('medications', e.target.value)}
                    placeholder="Liste medicamentos e dosagens..."
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Alergias
                  </label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    placeholder="Descreva alergias conhecidas..."
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Cirurgias Anteriores
                  </label>
                  <textarea
                    value={formData.surgeries}
                    onChange={(e) => handleInputChange('surgeries', e.target.value)}
                    placeholder="Descreva cirurgias realizadas..."
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Internações
                  </label>
                  <textarea
                    value={formData.hospitalizations}
                    onChange={(e) => handleInputChange('hospitalizations', e.target.value)}
                    placeholder="Descreva internações anteriores..."
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico Familiar */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Histórico Familiar</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Histórico Médico Familiar
                </label>
                <textarea
                  value={formData.family_medical_history}
                  onChange={(e) => handleInputChange('family_medical_history', e.target.value)}
                  placeholder="Descreva histórico médico de familiares..."
                  rows={4}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Estilo de Vida */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Estilo de Vida</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Atividade Física
                  </label>
                  <textarea
                    value={formData.physical_activity}
                    onChange={(e) => handleInputChange('physical_activity', e.target.value)}
                    placeholder="Descreva atividades físicas praticadas..."
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Tipo de Dieta
                  </label>
                  <textarea
                    value={formData.diet_type}
                    onChange={(e) => handleInputChange('diet_type', e.target.value)}
                    placeholder="Descreva tipo de dieta..."
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Qualidade do Sono
                  </label>
                  <textarea
                    value={formData.sleep_quality}
                    onChange={(e) => handleInputChange('sleep_quality', e.target.value)}
                    placeholder="Descreva qualidade do sono..."
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Hábitos de Fumo
                  </label>
                  <textarea
                    value={formData.smoking_habits}
                    onChange={(e) => handleInputChange('smoking_habits', e.target.value)}
                    placeholder="Descreva hábitos de fumo..."
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Consumo de Álcool
                  </label>
                  <textarea
                    value={formData.alcohol_consumption}
                    onChange={(e) => handleInputChange('alcohol_consumption', e.target.value)}
                    placeholder="Descreva consumo de álcool..."
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações Adicionais */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Observações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={formData.additional_notes}
                  onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                  placeholder="Adicione qualquer informação adicional relevante..."
                  rows={4}
                  className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/anamneses/${id}`)}
              disabled={loading}
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 sm:py-2.5"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}