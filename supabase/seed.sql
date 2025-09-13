-- Seed data para desenvolvimento e testes
-- Este arquivo popula o banco com dados iniciais

-- Inserir usuários de exemplo
INSERT INTO users (id, email, name, role, department, specialization) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@hidroginastica.com', 'Administrador Sistema', 'admin', 'Administração', 'Gestão'),
  ('550e8400-e29b-41d4-a716-446655440002', 'coordenador@hidroginastica.com', 'Maria Silva', 'coordenador', 'Educação Física', 'Hidroginástica'),
  ('550e8400-e29b-41d4-a716-446655440003', 'professor1@hidroginastica.com', 'João Santos', 'professor', 'Educação Física', 'Hidroginástica'),
  ('550e8400-e29b-41d4-a716-446655440004', 'professor2@hidroginastica.com', 'Ana Costa', 'professor', 'Educação Física', 'Natação')
ON CONFLICT (email) DO NOTHING;

-- Inserir alunos de exemplo
INSERT INTO students (id, name, birth_date, phone, email, address, emergency_contact, class_group, created_by) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Carlos Oliveira',
    '1975-03-15',
    '(11) 99999-1111',
    'carlos.oliveira@email.com',
    '{
      "street": "Rua das Flores, 123",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    }',
    '{
      "name": "Maria Oliveira",
      "relationship": "Esposa",
      "phone": "(11) 88888-1111"
    }',
    'Turma A - Manhã',
    '550e8400-e29b-41d4-a716-446655440003'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'Fernanda Lima',
    '1982-07-22',
    '(11) 99999-2222',
    'fernanda.lima@email.com',
    '{
      "street": "Av. Paulista, 456",
      "neighborhood": "Bela Vista",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310-100"
    }',
    '{
      "name": "Roberto Lima",
      "relationship": "Marido",
      "phone": "(11) 88888-2222"
    }',
    'Turma B - Tarde',
    '550e8400-e29b-41d4-a716-446655440003'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'José Pereira',
    '1968-11-08',
    '(11) 99999-3333',
    'jose.pereira@email.com',
    '{
      "street": "Rua Augusta, 789",
      "neighborhood": "Consolação",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01305-000"
    }',
    '{
      "name": "Ana Pereira",
      "relationship": "Filha",
      "phone": "(11) 88888-3333"
    }',
    'Turma A - Manhã',
    '550e8400-e29b-41d4-a716-446655440004'
  )
ON CONFLICT (id) DO NOTHING;

-- Inserir anamneses de exemplo
INSERT INTO anamneses (
  id,
  student_id,
  status,
  medical_history,
  current_medications,
  allergies,
  physical_limitations,
  lifestyle_habits,
  objectives,
  lgpd_consent,
  created_by,
  expires_at
) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    'completed',
    '{
      "conditions": ["Hipertensão", "Diabetes tipo 2"],
      "surgeries": ["Cirurgia de catarata (2020)"],
      "familyHistory": "Histórico familiar de diabetes",
      "observations": "Paciente bem controlado com medicação"
    }',
    '[
      "Losartana 50mg - 1x ao dia",
      "Metformina 850mg - 2x ao dia"
    ]',
    '[
      "Alergia a dipirona"
    ]',
    '[
      "Limitação de movimento no joelho direito"
    ]',
    '{
      "smoking": false,
      "alcohol": "Ocasionalmente",
      "exercise": "Caminhada 3x por semana",
      "sleep": "7-8 horas por noite"
    }',
    '{
      "primary": "Melhorar condicionamento físico",
      "secondary": "Reduzir dores nas articulações",
      "expectations": "Maior disposição no dia a dia"
    }',
    '{
      "agreed": true,
      "date": "2024-01-15T10:30:00Z",
      "ip": "192.168.1.100"
    }',
    '550e8400-e29b-41d4-a716-446655440003',
    NOW() + INTERVAL '6 months'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002',
    'completed',
    '{
      "conditions": ["Fibromialgia"],
      "surgeries": [],
      "familyHistory": "Sem histórico relevante",
      "observations": "Dores musculares frequentes"
    }',
    '[
      "Pregabalina 75mg - 2x ao dia"
    ]',
    '[]',
    '[
      "Dores musculares generalizadas"
    ]',
    '{
      "smoking": false,
      "alcohol": "Não consome",
      "exercise": "Sedentária",
      "sleep": "Sono irregular, 5-6 horas"
    }',
    '{
      "primary": "Reduzir dores musculares",
      "secondary": "Melhorar qualidade do sono",
      "expectations": "Maior bem-estar geral"
    }',
    '{
      "agreed": true,
      "date": "2024-01-20T14:15:00Z",
      "ip": "192.168.1.101"
    }',
    '550e8400-e29b-41d4-a716-446655440003',
    NOW() + INTERVAL '6 months'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440003',
    'draft',
    '{
      "conditions": [],
      "surgeries": [],
      "familyHistory": "",
      "observations": ""
    }',
    '[]',
    '[]',
    '[]',
    '{
      "smoking": false,
      "alcohol": "",
      "exercise": "",
      "sleep": ""
    }',
    '{
      "primary": "",
      "secondary": "",
      "expectations": ""
    }',
    '{
      "agreed": false,
      "date": null,
      "ip": null
    }',
    '550e8400-e29b-41d4-a716-446655440004',
    NOW() + INTERVAL '30 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Inserir notificações de exemplo
INSERT INTO notifications (type, title, message, data, user_id) VALUES
  (
    'anamnese_expiring',
    'Anamnese expirando em breve',
    'A anamnese do aluno Carlos Oliveira expira em 30 dias.',
    '{
      "student_id": "660e8400-e29b-41d4-a716-446655440001",
      "student_name": "Carlos Oliveira",
      "expires_at": "2024-07-15T10:30:00Z"
    }',
    '550e8400-e29b-41d4-a716-446655440003'
  ),
  (
    'new_student',
    'Novo aluno cadastrado',
    'O aluno José Pereira foi cadastrado na Turma A - Manhã.',
    '{
      "student_id": "660e8400-e29b-41d4-a716-446655440003",
      "student_name": "José Pereira",
      "class_group": "Turma A - Manhã"
    }',
    '550e8400-e29b-41d4-a716-446655440002'
  )
ON CONFLICT (id) DO NOTHING;

-- Inserir logs de auditoria de exemplo
INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id) VALUES
  (
    'students',
    '660e8400-e29b-41d4-a716-446655440001',
    'INSERT',
    '{"name": "Carlos Oliveira", "class_group": "Turma A - Manhã"}',
    '550e8400-e29b-41d4-a716-446655440003'
  ),
  (
    'anamneses',
    '770e8400-e29b-41d4-a716-446655440001',
    'INSERT',
    '{"student_id": "660e8400-e29b-41d4-a716-446655440001", "status": "completed"}',
    '550e8400-e29b-41d4-a716-446655440003'
  )
ON CONFLICT (id) DO NOTHING;

-- Atualizar timestamps para dados mais realistas
UPDATE students SET 
  created_at = NOW() - INTERVAL '30 days',
  updated_at = NOW() - INTERVAL '25 days'
WHERE name IN ('Carlos Oliveira', 'Fernanda Lima');

UPDATE students SET 
  created_at = NOW() - INTERVAL '5 days',
  updated_at = NOW() - INTERVAL '5 days'
WHERE name = 'José Pereira';

UPDATE anamneses SET 
  created_at = NOW() - INTERVAL '25 days',
  updated_at = NOW() - INTERVAL '25 days',
  completed_at = NOW() - INTERVAL '25 days'
WHERE status = 'completed';

UPDATE anamneses SET 
  created_at = NOW() - INTERVAL '3 days',
  updated_at = NOW() - INTERVAL '1 day'
WHERE status = 'draft';