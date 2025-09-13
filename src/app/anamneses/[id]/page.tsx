'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  ArrowLeft, 
  Edit, 
  User, 
  FileText, 
  Calendar,
  Clock,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Heart,
  Activity,
  Stethoscope,
  Users,
  Coffee,
  Moon,
  Cigarette,
  Wine,
  FileX,
  Shield
} from 'lucide-react';
import { Anamnese } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';

// Função para exibir valores sem tradução automática
const translateValue = (value: string): string => {
  // Retorna o valor original sem tradução
  return value;
};


interface AnamneseWithRelations extends Anamnese {
  student: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    birth_date?: string;
    cpf?: string;
  };
  created_by_user: {
    name: string;
    email: string;
  };
}

export default function AnamnesePage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [anamnesis, setAnamnese] = useState<AnamneseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    if (authLoading) return; // Aguarda o carregamento da autenticação
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (id) {
      fetchAnamnese();
    }
  }, [user, router, id, authLoading]);

  const fetchAnamnese = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anamneses')
        .select(`
          *,
          student:students!anamneses_student_id_fkey(id, name, email, phone, birth_date, cpf),
          created_by_user:users!anamneses_created_by_fkey(name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setAnamnese(data);
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



  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !anamnesis) {
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

  const statusInfo = getStatusInfo(anamnesis.status);
  const StatusIcon = statusInfo.icon;
  const daysUntilExpiration = getDaysUntilExpiration(anamnesis.created_at);
  const data = anamnesis || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/anamneses')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {anamnesis.title || `Anamnese ${formatDate(anamnesis.created_at)}` || `Anamnese ${formatDate(anamnesis.created_at)}`}
              </h1>
              <p className="text-gray-600 mt-1">
                Anamnese de {anamnesis.student.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2 ${statusInfo.color}`}>
              <StatusIcon className="h-4 w-4" />
              {statusInfo.label}
            </span>
            

            
            {hasPermission('update_anamnesis') && anamnesis.status !== 'expired' && (
              <Button
                onClick={() => router.push(`/anamneses/${id}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dados do Aluno</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{anamnesis.student.name}</span>
                    </div>
                    {anamnesis.student.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{anamnesis.student.email}</span>
                      </div>
                    )}
                    {anamnesis.student.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{anamnesis.student.phone}</span>
                      </div>
                    )}
                    {anamnesis.student.birth_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Nascimento: {formatDate(anamnesis.student.birth_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dados da Anamnese</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Criada em: {formatDate(anamnesis.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {anamnesis.status === 'expired' 
                          ? 'Expirou'
                          : `Expira em ${daysUntilExpiration} dias`
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Por: {anamnesis.created_by_user.name}</span>
                    </div>
                    {anamnesis.updated_at && anamnesis.updated_at !== anamnesis.created_at && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Atualizada: {formatDateTime(anamnesis.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {anamnesis.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Observações Gerais</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{anamnesis.notes || ""}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contato de Emergência - Removido pois não existe na estrutura atual */}

          {/* Limitações Físicas */}
          {data.physical_limitations && Array.isArray(data.physical_limitations) && data.physical_limitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Limitações Físicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700 bg-yellow-50 p-3 rounded-md">
                  {data.physical_limitations.map((limitation, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                      {typeof limitation === 'string' ? limitation : limitation.description}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico Médico */}
          {data.medical_history && Object.values(data.medical_history).some(v => v) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Histórico Médico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.medical_history.other_conditions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Outras Condições Médicas</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                      {data.medical_history.other_conditions}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.current_medications && data.current_medications.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Medicamentos em Uso</h4>
                      <div className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {data.current_medications.map((med, index) => (
                          <div key={index} className="mb-1">
                            {med.name}{med.dosage && ` - ${med.dosage}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {data.allergies && Array.isArray(data.allergies) && data.allergies.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Alergias</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {data.allergies.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.medical_history.surgeries && Array.isArray(data.medical_history.surgeries) && data.medical_history.surgeries.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Cirurgias Anteriores</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {data.medical_history.surgeries.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {data.medical_history.hospitalizations && Array.isArray(data.medical_history.hospitalizations) && data.medical_history.hospitalizations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Internações</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {data.medical_history.hospitalizations.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico Familiar */}
          {data.medical_history.family_history && Array.isArray(data.medical_history.family_history) && data.medical_history.family_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Histórico Familiar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Histórico Médico Familiar</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                    {data.medical_history.family_history.join(', ')}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estilo de Vida */}
          {data.lifestyle_habits && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Estilo de Vida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.lifestyle_habits.physical_activity?.types && Array.isArray(data.lifestyle_habits.physical_activity.types) && data.lifestyle_habits.physical_activity.types.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Atividade Física
                      </h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {data.lifestyle_habits.physical_activity.types.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {data.lifestyle_habits.diet?.type && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Coffee className="h-4 w-4" />
                        Tipo de Dieta
                      </h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {translateValue(data.lifestyle_habits.diet.type)}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.lifestyle_habits.sleep?.quality && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Qualidade do Sono
                      </h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {translateValue(data.lifestyle_habits.sleep.quality)}
                      </p>
                    </div>
                  )}
                  
                  {data.lifestyle_habits.smoking && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Cigarette className="h-4 w-4" />
                        Hábitos de Fumo
                      </h4>
                      <div className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p>Status: {translateValue(data.lifestyle_habits.smoking.status)}</p>
                        {data.lifestyle_habits.smoking.quantity && (
                          <p>Quantidade: {data.lifestyle_habits.smoking.quantity}</p>
                        )}
                        {data.lifestyle_habits.smoking.quit_date && (
                          <p>Data que parou: {data.lifestyle_habits.smoking.quit_date}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {data.lifestyle_habits.alcohol && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Wine className="h-4 w-4" />
                        Consumo de Álcool
                      </h4>
                      <div className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        <p>Frequência: {translateValue(data.lifestyle_habits.alcohol.frequency)}</p>
                        {data.lifestyle_habits.alcohol.quantity && (
                          <p>Quantidade: {data.lifestyle_habits.alcohol.quantity}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Autorização Médica */}
          {data.medical_authorization && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Autorização Médica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.medical_authorization.has_authorization && (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>Autorizado para atividades físicas</span>
                    </div>
                  )}
                  {data.medical_authorization.restrictions && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Restrições</h4>
                      <p className="text-gray-700 bg-yellow-50 p-3 rounded-md">
                        {data.medical_authorization.restrictions}
                      </p>
                    </div>
                  )}
                  {data.medical_authorization.doctor_name && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Médico Responsável</h4>
                      <p className="text-gray-700">{data.medical_authorization.doctor_name}</p>
                    </div>
                  )}
                  {data.medical_authorization.authorization_date && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Data da Autorização</h4>
                      <p className="text-gray-700">{formatDate(data.medical_authorization.authorization_date)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dados Físicos/Antropométricos */}
          {data.physical_data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Dados Físicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.physical_data?.height && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Altura</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {data.physical_data.height} cm
                      </p>
                    </div>
                  )}
                  
                  {data.physical_data?.weight && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Peso</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {data.physical_data.weight} kg
                      </p>
                    </div>
                  )}
                  
                  {data.physical_data?.bmi && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">IMC</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                        {data.physical_data.bmi}
                      </p>
                    </div>
                  )}
                </div>
                
                {data.physical_data && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Dados Físicos</h4>
                    <div className="space-y-2">
                      {data.physical_data.height && (
                        <p className="text-gray-700">Altura: {data.physical_data.height} cm</p>
                      )}
                      {data.physical_data.weight && (
                        <p className="text-gray-700">Peso: {data.physical_data.weight} kg</p>
                      )}
                      {data.physical_data.bmi && (
                        <p className="text-gray-700">IMC: {data.physical_data.bmi}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sintomas Atuais */}
          {(data.current_symptoms || data.pain_scale !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Condição Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.current_symptoms && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Sintomas Atuais</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                      {data.current_symptoms}
                    </p>
                  </div>
                )}
                
                {(data.pain_scale !== undefined && data.pain_scale !== null) && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Escala de Dor (0-10)</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                      {data.pain_scale}/10
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}



          {/* Observações Adicionais */}
          {data.additional_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileX className="h-5 w-5" />
                  Observações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.additional_notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Observações Adicionais</h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">
                      {data.additional_notes}
                    </p>
                  </div>
                )}

              </CardContent>
            </Card>
          )}

          {/* Assinatura */}
          {data.signature && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.signature.signed_by && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Assinado por</h4>
                      <p className="text-gray-700">{data.signature.signed_by}</p>
                    </div>
                  )}
                  {data.signature.signed_at && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Data da Assinatura</h4>
                      <p className="text-gray-700">{formatDateTime(data.signature.signed_at)}</p>
                    </div>
                  )}
                  {data.signature.signature_data && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Assinatura Digital</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <img 
                          src={data.signature.signature_data} 
                          alt="Assinatura" 
                          className="max-w-xs border border-gray-200 rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
           )}

          {/* Consentimento LGPD */}
          {data.lgpd_consent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Consentimento LGPD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.lgpd_consent.accepted && (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span>Consentimento concedido para tratamento de dados pessoais</span>
                    </div>
                  )}
                  {data.lgpd_consent.accepted_at && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Data do Consentimento</h4>
                      <p className="text-gray-700">{formatDateTime(data.lgpd_consent.accepted_at)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        

      </div>
    </div>
  );
}