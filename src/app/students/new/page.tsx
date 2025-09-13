'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { ArrowLeft, Save, User } from 'lucide-react';
import { validateEmail, validateCPF, formatPhone, formatCPF, formatZipCode } from '@/lib/utils';

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
  class_name: string;
  schedule: string;
  weekdays: string;
}

const initialFormData: StudentFormData = {
  name: '',
  email: '',
  phone: '',
  cpf: '',
  birth_date: '',
  gender: '',
  address: '',
  address_number: '',
  address_complement: '',
  city: '',
  state: '',
  zip_code: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  class_name: '',
  schedule: '',
  weekdays: ''
};

export default function NewStudentPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<StudentFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && (!user || !hasPermission('create_student'))) {
      router.push('/dashboard');
    }
  }, [mounted, authLoading, user, hasPermission, router]);

  if (!mounted || authLoading) {
    return <div>Carregando...</div>;
  }

  if (!user || !hasPermission('create_student')) {
    return <div>Redirecionando...</div>;
  }

  const validateForm = (): boolean => {
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

    if (!formData.class_name.trim()) {
      errors.class_name = 'Turma é obrigatória';
    }

    if (!formData.schedule.trim()) {
      errors.schedule = 'Horário é obrigatório';
    }

    if (!formData.weekdays.trim()) {
      errors.weekdays = 'Dias da semana são obrigatórios';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Function to fetch address data from ViaCEP API
  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return null;
    }

    try {
      setLoadingCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro na consulta do CEP');
      }
      
      const data = await response.json();
      
      if (data.erro) {
        setFieldErrors(prev => ({ ...prev, zip_code: 'CEP não encontrado' }));
        return null;
      }
      
      // Clear CEP error if successful
      setFieldErrors(prev => ({ ...prev, zip_code: '' }));
      
      return {
        address: data.logradouro || '',
        city: data.localidade || '',
        state: data.uf || '',
        neighborhood: data.bairro || ''
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setFieldErrors(prev => ({ ...prev, zip_code: 'Erro ao consultar CEP. Tente novamente.' }));
      return null;
    } finally {
      setLoadingCep(false);
    }
  };

  const handleInputChange = async (field: keyof StudentFormData, value: string) => {
    let formattedValue = value;

    // Format phone, CPF and zip code as user types
    if (field === 'phone' || field === 'emergency_contact_phone') {
      formattedValue = formatPhone(value);
    } else if (field === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (field === 'zip_code') {
      formattedValue = formatZipCode(value);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-fill address when CEP is complete
    if (field === 'zip_code' && formattedValue.replace(/\D/g, '').length === 8) {
      const addressData = await fetchAddressByCep(formattedValue);
      if (addressData) {
        setFormData(prev => ({
          ...prev,
          address: addressData.address,
          city: addressData.city,
          state: addressData.state
        }));
        
        // Clear related field errors
        setFieldErrors(prev => ({
          ...prev,
          address: '',
          city: '',
          state: ''
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Prepare data with correct structure for database
      const studentData = {
        name: formData.name,
        birth_date: formData.birth_date,
        phone: formData.phone || null,
        email: formData.email || null,
        cpf: formData.cpf || null,
        gender: formData.gender || null,
        address: formData.address ? {
          street: formData.address,
          number: formData.address_number,
          complement: formData.address_complement,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code
        } : null,
        emergency_contact: formData.emergency_contact_name ? {
          name: formData.emergency_contact_name,
          phone: formData.emergency_contact_phone
        } : null,
        observations: null,
        class_group: formData.class_name || null,
        schedule: formData.schedule || null,
        weekdays: formData.weekdays || null,
        status: 'active',
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('students')
        .insert(studentData)
        .select()
        .single();

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
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900">Novo Aluno</h1>
            <p className="text-gray-600 mt-1">
              Cadastre um novo aluno no sistema
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
                    className="bg-gray-50"
                    readOnly
                    disabled
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
                    className="bg-gray-50"
                    readOnly
                    disabled
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
                    className="bg-gray-50"
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP *
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      disabled={loadingCep}
                    />
                    {loadingCep && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  {fieldErrors.zip_code && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.zip_code}</p>
                  )}
                  {!formData.zip_code && (
                    <p className="text-blue-600 text-sm mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Preencha o CEP para carregar automaticamente o endereço
                    </p>
                  )}
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
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar Aluno
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}