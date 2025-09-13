'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { ArrowLeft, Save, User, Loader2 } from 'lucide-react';
import { validateEmail, validateCPF, formatPhone, formatCPF, formatZipCode } from '@/lib/utils';
import { Student } from '@/types';

interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  gender: string;
  address: string;
  address_number: string;
  address_complement: string;
  city: string;
  state: string;
  zip_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  status: string;
  class_name: string;
  schedule: string;
  weekdays: string;
}

export default function EditStudentPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<StudentFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Função para traduzir status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'suspended':
        return 'Em Licença';
      default:
        return status;
    }
  };

  useEffect(() => {
    if (!user || !hasPermission('update_student')) {
      router.push('/dashboard');
      return;
    }
    fetchStudent();
  }, [user, studentId, router]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      
      setStudent(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        cpf: data.cpf || '',
        birth_date: data.birth_date || '',
        gender: data.gender || '',
        address: data.address?.street || '',
        address_number: data.address?.number || '',
        address_complement: data.address?.complement || '',
        city: data.address?.city || '',
        state: data.address?.state || '',
        zip_code: data.address?.zip_code || '',
        emergency_contact_name: data.emergency_contact?.name || '',
        emergency_contact_phone: data.emergency_contact?.phone || '',
        status: data.status || 'active',
        class_name: data.class_group || '',
        schedule: data.schedule || '',
        weekdays: data.weekdays || ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData) return false;
    
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Telefone é obrigatório';
    }

    if (!formData.cpf.trim()) {
      errors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      errors.cpf = 'CPF inválido';
    }

    if (!formData.birth_date) {
      errors.birth_date = 'Data de nascimento é obrigatória';
    }

    if (!formData.gender) {
      errors.gender = 'Gênero é obrigatório';
    }

    if (!formData.status.trim()) {
      errors.status = 'Status é obrigatório';
    }

    if (!formData.class_name.trim()) {
      errors.class_name = 'Turma é obrigatória';
    }

    if (!formData.schedule.trim()) {
      errors.schedule = 'Horário é obrigatório';
    }

    if (!formData.weekdays.trim()) {
      errors.weekdays = 'Dias da semana são obrigatórios';
    }

    if (!formData.address.trim()) {
      errors.address = 'Endereço é obrigatório';
    }

    if (!formData.address_number.trim()) {
      errors.address_number = 'Número é obrigatório';
    }

    if (!formData.city.trim()) {
      errors.city = 'Cidade é obrigatória';
    }

    if (!formData.state.trim()) {
      errors.state = 'Estado é obrigatório';
    }

    if (!formData.zip_code.trim()) {
      errors.zip_code = 'CEP é obrigatório';
    }

    if (!formData.emergency_contact_name.trim()) {
      errors.emergency_contact_name = 'Nome do contato de emergência é obrigatório';
    }

    if (!formData.emergency_contact_phone.trim()) {
      errors.emergency_contact_phone = 'Telefone do contato de emergência é obrigatório';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    if (!formData) return;
    
    let formattedValue = value;

    // Format phone, CPF and zip code as user types
    if (field === 'phone' || field === 'emergency_contact_phone') {
      formattedValue = formatPhone(value);
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (field === 'zip_code') {
      formattedValue = formatZipCode(value);
    }

    setFormData(prev => prev ? { ...prev, [field]: formattedValue } : null);
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData || !validateForm()) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: formData.name,
          birth_date: formData.birth_date,
          phone: formData.phone || null,
          email: formData.email || null,
          cpf: formData.cpf || null,
          gender: formData.gender || null,
          address: formData.address ? {
            street: formData.address,
            number: formData.address_number,
            complement: formData.address_complement || null,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code
          } : null,
          emergency_contact: formData.emergency_contact_name ? {
            name: formData.emergency_contact_name,
            phone: formData.emergency_contact_phone
          } : null,
          status: formData.status,
          class_group: formData.class_name || null,
          schedule: formData.schedule || null,
          weekdays: formData.weekdays || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      router.push('/students');
    } catch (err: any) {
      if (err.code === '23505') {
        if (err.message.includes('email')) {
          setFieldErrors({ email: 'Este email já está cadastrado' });
        } else if (err.message.includes('cpf')) {
          setFieldErrors({ cpf: 'Este CPF já está cadastrado' });
        } else {
          setError('Dados duplicados encontrados');
        }
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!student || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              Aluno não encontrado ou você não tem permissão para editá-lo.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Aluno</h1>
            <p className="text-gray-600 mt-1">
              Atualize as informações de {student.name}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Atenção:</span> Os campos marcados com asterisco (*) são de preenchimento obrigatório.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={fieldErrors.name}
                    placeholder="Digite o nome completo"
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status">
                        {formData.status ? getStatusLabel(formData.status) : "Selecione o status"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="suspended">Em Licença</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    error={fieldErrors.email}
                    placeholder="email@exemplo.com"
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF *
                  </label>
                  <Input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', e.target.value)}
                    error={fieldErrors.cpf}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                  {fieldErrors.cpf && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.cpf}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Nascimento *
                  </label>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                    error={fieldErrors.birth_date}
                  />
                  {fieldErrors.birth_date && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.birth_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gênero *
                  </label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                    <SelectTrigger className={fieldErrors.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                      <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.gender && (
                    <p className="text-sm text-red-600 mt-1">{fieldErrors.gender}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class and Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Turma e Horário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Turma *
                  </label>
                  <Input
                    type="text"
                    value={formData.class_name}
                    onChange={(e) => handleInputChange('class_name', e.target.value)}
                    placeholder="Nome da turma"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário *
                  </label>
                  <Input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => handleInputChange('schedule', e.target.value)}
                    placeholder="Ex. 8 horas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dias da Semana *
                  </label>
                  <Select
                    value={formData.weekdays}
                    onValueChange={(value) => handleInputChange('weekdays', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione os dias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="segunda-quarta">Segunda e Quarta</SelectItem>
                      <SelectItem value="segunda-quarta-sexta">Segunda, Quarta e Sexta</SelectItem>
                      <SelectItem value="terca-quinta">Terça e Quinta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço *
                  </label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Rua, avenida"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número *
                  </label>
                  <Input
                    type="text"
                    value={formData.address_number}
                    onChange={(e) => handleInputChange('address_number', e.target.value)}
                    placeholder="123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento
                  </label>
                  <Input
                    type="text"
                    value={formData.address_complement}
                    onChange={(e) => handleInputChange('address_complement', e.target.value)}
                    placeholder="Apto, bloco, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade *
                  </label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Nome da cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado *
                  </label>
                  <Input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP *
                  </label>
                  <Input
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contato de Emergência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Contato *
                  </label>
                  <Input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone do Contato *
                  </label>
                  <Input
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}