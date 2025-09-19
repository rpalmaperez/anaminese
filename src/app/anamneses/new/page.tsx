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
  ArrowLeft, 
  Save, 
  User, 
  FileText, 
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Student } from '@/types';
import { validateEmail, validatePhone, validateCPF, formatPhone, formatCPF } from '@/lib/utils';

interface FormData {
  student_id: string;
  title: string;
  notes: string;
  status: 'draft' | 'completed';
  
  // Histórico médico
  medical_conditions: string;
  medications: string;
  allergies: string;
  surgeries: string;
  hospitalizations: string;
  
  // Histórico familiar
  family_medical_history: string;
  
  // Dados físicos
  weight: number;
  height: number;
  bmi: number;
  
  // Estilo de vida
  physical_activity: string;
  diet_habits: string;
  sleep_pattern: string;
  smoking_habits: string;
  alcohol_consumption: string;
  
  // Sintomas atuais
  current_symptoms: string;
  symptom_duration: string;
  pain_scale: number;

  // Observações adicionais
  additional_notes: string;
  
  // Contato de emergência
  emergency_contact_phone: string;
}

const initialFormData: FormData = {
  student_id: '',
  title: '',
  notes: '',
  status: 'draft',
  medical_conditions: '',
  medications: '',
  allergies: '',
  surgeries: '',
  hospitalizations: '',
  family_medical_history: '',
  weight: 0,
  height: 0,
  bmi: 0,
  physical_activity: '',
  diet_habits: '',
  sleep_pattern: '',
  smoking_habits: '',
  alcohol_consumption: '',
  current_symptoms: '',
  symptom_duration: '',
  pain_scale: 0,
  additional_notes: '',
  emergency_contact_phone: ''
};

export default function NewAnamnesisPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Aguardar o carregamento do contexto de autenticação
    if (authLoading) {
      return;
    }
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (!hasPermission('create_anamnesis')) {
      router.push('/dashboard');
      return;
    }
    
    fetchStudents();
  }, [user, router, hasPermission, authLoading]);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('id, name, email, phone')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.student_id) {
      newErrors.student_id = 'Selecione um aluno';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (formData.emergency_contact_phone && !validatePhone(formData.emergency_contact_phone)) {
      newErrors.emergency_contact_phone = 'Telefone inválido';
    }

    if (formData.pain_scale < 0 || formData.pain_scale > 10) {
      newErrors.pain_scale = 'Escala de dor deve estar entre 0 e 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
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
    
    if (!validateForm()) {
      setError('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const anamnesisData = {
        student_id: formData.student_id,
        title: formData.title || null,
        status: formData.status,
        created_by: user!.id,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
        notes: formData.notes || null,
        physical_data: {
          weight: formData.weight || null,
          height: formData.height || null,
          bmi: formData.bmi || null
        },
        current_symptoms: formData.current_symptoms || '',
        symptom_duration: formData.symptom_duration || '',
        pain_scale: formData.pain_scale || null,
        additional_notes: formData.additional_notes || null,
        medical_history: {
          diseases: [],
          surgeries: formData.surgeries ? formData.surgeries.split(',').map(surgery => surgery.trim()) : [],
          hospitalizations: formData.hospitalizations ? formData.hospitalizations.split(',').map(hosp => hosp.trim()) : [],
          family_history: formData.family_medical_history ? formData.family_medical_history.split(',').map(history => history.trim()) : [],
          other_conditions: formData.medical_conditions || ''
        },
        current_medications: formData.medications ? formData.medications.split(',').map(med => ({
          name: med.trim(),
          dosage: '',
          frequency: '',
          reason: ''
        })) : [],
        allergies: formData.allergies ? formData.allergies.split(',').map(allergy => allergy.trim()) : [],
        physical_limitations: [],
        lifestyle_habits: {
          physical_activity: {
            frequency: 'regular',
            types: formData.physical_activity ? formData.physical_activity.split(',').map(activity => activity.trim()) : [],
            duration_per_session: 0
          },
          smoking: {
            status: formData.smoking_habits || 'never',
            quantity: '',
            quit_date: ''
          },
          alcohol: {
            frequency: formData.alcohol_consumption || 'never',
            quantity: ''
          },
          sleep: {
            hours_per_night: 8,
            quality: 'fair',
            sleep_disorders: [],
            pattern: formData.sleep_pattern || ''
          },
          diet: {
            type: 'omnivore',
            restrictions: [],
            supplements: [],
            habits: formData.diet_habits || ''
          },
          stress_level: 'medium'
        },
        objectives: {
          primary: [],
          secondary: [],
          expectations: formData.current_symptoms || ''
        },
        lgpd_consent: {
          accepted: true,
          accepted_at: new Date().toISOString(),
          version: '1.0',
          ip_address: 'localhost'
        }
      };

      const { data, error } = await supabase
        .from('anamneses')
        .insert([anamnesisData])
        .select()
        .single();

      if (error) throw error;

      setSuccess('Anamnese criada com sucesso!');
      setTimeout(() => {
        router.push(`/anamneses/${data.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (studentsLoading) {
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

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Voltar</span>
            <span className="xs:hidden">←</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Nova Anamnese</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Preencha as informações da anamnese
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 sm:mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
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
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aluno *
                  </label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => handleInputChange('student_id', value)}
                  >
                    <SelectTrigger className={`text-sm ${errors.student_id ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Selecione um aluno">
                        {formData.student_id ? (
                          students.find(s => s.id === formData.student_id)?.name || 'Aluno não encontrado'
                        ) : (
                          <span className="text-gray-500">Selecione um aluno</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id} className="text-sm">
                          <div className="flex flex-col">
                            <span>{student.name}</span>
                            {student.email && (
                              <span className="text-xs text-gray-500 hidden sm:inline">{student.email}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.student_id && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.student_id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Anamnese Inicial - Janeiro 2024"
                    error={errors.title}
                    className="text-sm"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value as 'draft' | 'completed')}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecione o status">
                        {formData.status === 'draft' ? 'Rascunho' : 'Completa'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft" className="text-sm">Rascunho</SelectItem>
                      <SelectItem value="completed" className="text-sm">Completa</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Rascunho: pode ser editado posteriormente. Completa: anamnese finalizada.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações Gerais
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Observações gerais sobre a anamnese..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Histórico Médico */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Histórico Médico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condições Médicas
                </label>
                <textarea
                  value={formData.medical_conditions}
                  onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                  placeholder="Descreva condições médicas existentes..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicamentos em Uso
                  </label>
                  <textarea
                    value={formData.medications}
                    onChange={(e) => handleInputChange('medications', e.target.value)}
                    placeholder="Liste medicamentos e dosagens..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alergias
                  </label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    placeholder="Descreva alergias conhecidas..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cirurgias Anteriores
                  </label>
                  <textarea
                    value={formData.surgeries}
                    onChange={(e) => handleInputChange('surgeries', e.target.value)}
                    placeholder="Descreva cirurgias realizadas..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Internações
                  </label>
                  <textarea
                    value={formData.hospitalizations}
                    onChange={(e) => handleInputChange('hospitalizations', e.target.value)}
                    placeholder="Descreva internações anteriores..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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

          {/* Dados Físicos */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Dados Físicos</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Peso (kg) *
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight || ''}
                    onChange={(e) => {
                      const weight = parseFloat(e.target.value) || 0;
                      handleInputChange('weight', weight);
                      // Calcular IMC automaticamente se altura também estiver preenchida
                      if (formData.height > 0) {
                        const heightInMeters = formData.height / 100;
                        const bmi = weight / (heightInMeters * heightInMeters);
                        handleInputChange('bmi', parseFloat(bmi.toFixed(1)));
                      }
                    }}
                    placeholder="Ex: 70.5"
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Altura (cm) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.height || ''}
                    onChange={(e) => {
                      const height = parseFloat(e.target.value) || 0;
                      handleInputChange('height', height);
                      // Calcular IMC automaticamente se peso também estiver preenchido
                      if (formData.weight > 0) {
                        const heightInMeters = height / 100;
                        const bmi = formData.weight / (heightInMeters * heightInMeters);
                        handleInputChange('bmi', parseFloat(bmi.toFixed(1)));
                      }
                    }}
                    placeholder="Ex: 175"
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    IMC
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.bmi || ''}
                    readOnly
                    className="bg-gray-50 text-xs sm:text-sm"
                    placeholder="Calculado automaticamente"
                  />
                  {formData.bmi > 0 && (
                    <p className="text-xs sm:text-sm mt-1 text-gray-600">
                      {formData.bmi < 18.5 && 'Abaixo do peso'}
                      {formData.bmi >= 18.5 && formData.bmi < 25 && 'Peso normal'}
                      {formData.bmi >= 25 && formData.bmi < 30 && 'Sobrepeso'}
                      {formData.bmi >= 30 && 'Obesidade'}
                    </p>
                  )}
                </div>
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
                    Hábitos Alimentares
                  </label>
                  <textarea
                    value={formData.diet_habits}
                    onChange={(e) => handleInputChange('diet_habits', e.target.value)}
                    placeholder="Descreva hábitos alimentares..."
                    rows={3}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Padrão de Sono
                  </label>
                  <textarea
                    value={formData.sleep_pattern}
                    onChange={(e) => handleInputChange('sleep_pattern', e.target.value)}
                    placeholder="Descreva padrão de sono..."
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

          {/* Condição Atual */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Condição Atual</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Sintomas Atuais
                  </label>
                  <textarea
                    value={formData.current_symptoms}
                    onChange={(e) => handleInputChange('current_symptoms', e.target.value)}
                    placeholder="Descreva sintomas atuais..."
                    rows={4}
                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Escala de Dor (0-10)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.pain_scale}
                    onChange={(e) => handleInputChange('pain_scale', parseInt(e.target.value) || 0)}
                    error={errors.pain_scale}
                    className="text-xs sm:text-sm"
                  />
                  {errors.pain_scale && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1">{errors.pain_scale}</p>
                  )}
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
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Anamnese
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}