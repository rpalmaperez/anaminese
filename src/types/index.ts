// Tipos de usuário e autenticação
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'coordenador' | 'professor';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  phone?: string;
  department?: string;
  specialization?: string;
}

// Tipos de aluno
export interface Student {
  id: string;
  name: string;
  birth_date: string;
  phone?: string;
  cpf?: string;
  email?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  };
  emergency_contact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  photo_url?: string;
  observations?: string;
  class_group?: string;
  schedule?: string;
  weekdays?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Tipos de anamnese
export interface MedicalHistory {
  diseases: string[];
  surgeries: string[];
  hospitalizations: string[];
  family_history: string[];
  other_conditions: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  reason: string;
}

export interface PhysicalLimitation {
  type: 'joint' | 'muscle' | 'bone' | 'neurological' | 'cardiovascular' | 'respiratory' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  restrictions: string[];
}

export interface LifestyleHabits {
  physical_activity: {
    frequency: 'sedentary' | 'light' | 'moderate' | 'intense';
    types: string[];
    duration_per_session?: number;
  };
  smoking: {
    status: 'never' | 'former' | 'current';
    quantity?: string;
    quit_date?: string;
  };
  alcohol: {
    frequency: 'never' | 'rarely' | 'occasionally' | 'regularly' | 'daily';
    quantity?: string;
  };
  sleep: {
    hours_per_night: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    sleep_disorders?: string[];
  };
  diet: {
    type: 'omnivore' | 'vegetarian' | 'vegan' | 'other';
    restrictions?: string[];
    supplements?: string[];
  };
  stress_level: 'low' | 'medium' | 'high';
}

export interface Objectives {
  primary: string[];
  secondary: string[];
  expectations: string;
  timeline?: string;
}

export interface Anamnese {
  id: string;
  student_id: string;
  title?: string;
  notes?: string;
  version: number;
  status: 'draft' | 'completed' | 'expired';
  // Dados médicos
  medical_history: MedicalHistory;
  current_medications: Medication[];
  allergies: string[];
  physical_limitations: PhysicalLimitation[];
  lifestyle_habits: LifestyleHabits;
  objectives: Objectives;
  // Condição atual
  current_symptoms?: string;
  symptom_duration?: string;
  pain_scale?: number;
  // Dados físicos
  physical_data?: {
    height?: number;
    weight?: number;
    bmi?: number;
    [key: string]: number | string | boolean | undefined;
  };
  // Exames
  recent_exams?: string;
  exam_results?: string;
  // Notas adicionais
  additional_notes?: string;
  
  // Documentos e autorizações
  medical_authorization?: {
    has_authorization: boolean;
    doctor_name?: string;
    doctor_crm?: string;
    authorization_date?: string;
    document_url?: string;
    restrictions?: string[];
  };
  
  // Assinatura e consentimento
  signature?: {
    signature_data: string; // Base64 da assinatura
    signed_by: string; // Nome de quem assinou
    relationship: 'student' | 'parent' | 'guardian' | 'responsible';
    signed_at: string;
    ip_address?: string;
  };
  
  lgpd_consent: {
    accepted: boolean;
    accepted_at: string;
    version: string;
    ip_address?: string;
  };
  
  // Metadados
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  completed_at?: string;
}

// Tipos para busca e filtros
export interface SearchFilters {
  name?: string;
  class_group?: string;
  medical_conditions?: string[];
  age_range?: {
    min: number;
    max: number;
  };
  anamnese_status?: ('current' | 'expired' | 'missing')[];
  last_anamnese_date?: {
    from: string;
    to: string;
  };
  created_by?: string;
  status?: Student['status'][];
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Tipos para relatórios
export interface ReportData {
  students_total: number;
  students_active: number;
  anamneses_current: number;
  anamneses_expired: number;
  anamneses_missing: number;
  medical_conditions_summary: Record<string, number>;
  age_distribution: Record<string, number>;
  class_distribution: Record<string, number>;
}

// Tipos para notificações
export interface Notification {
  id: string;
  type: 'anamnese_expiring' | 'anamnese_expired' | 'new_student' | 'system' | 'reminder';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  user_id: string;
  created_at: string;
}

// Tipos para funcionalidade offline
export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'student' | 'anamnese' | 'user';
  data: Student | Anamnese | User | Record<string, unknown>;
  timestamp: string;
  synced: boolean;
}

export interface SyncStatus {
  is_online: boolean;
  last_sync: string;
  pending_actions: number;
  sync_in_progress: boolean;
}

// Tipos para formulários
export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Tipos para API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Tipos estendidos com relacionamentos
export interface AnamneseWithStudent extends Anamnese {
  student: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface AnamneseWithRelations extends Anamnese {
  student: Student;
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