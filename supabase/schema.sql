-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'coordenador', 'professor');
CREATE TYPE student_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE anamnese_status AS ENUM ('draft', 'completed', 'expired');
CREATE TYPE notification_type AS ENUM ('anamnese_expiring', 'anamnese_expired', 'new_student', 'system', 'reminder');
CREATE TYPE action_type AS ENUM ('create', 'update', 'delete');
CREATE TYPE entity_type AS ENUM ('student', 'anamnese', 'user');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- Tabela de usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'professor',
    avatar_url TEXT,
    phone TEXT,
    department TEXT,
    specialization TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de alunos
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    phone TEXT,
    email TEXT,
    address JSONB,
    emergency_contact JSONB,
    photo_url TEXT,
    observations TEXT,
    class_group TEXT,
    status student_status DEFAULT 'active',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de anamneses
CREATE TABLE anamneses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    status anamnese_status DEFAULT 'draft',
    medical_history JSONB NOT NULL DEFAULT '{}',
    current_medications JSONB NOT NULL DEFAULT '[]',
    allergies JSONB NOT NULL DEFAULT '[]',
    physical_limitations JSONB NOT NULL DEFAULT '[]',
    lifestyle_habits JSONB NOT NULL DEFAULT '{}',
    objectives JSONB NOT NULL DEFAULT '{}',
    medical_authorization JSONB,
    signature JSONB,
    lgpd_consent JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de notificações
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ações offline
CREATE TABLE offline_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type action_type NOT NULL,
    entity entity_type NOT NULL,
    data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    synced BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de auditoria
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action audit_action NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_students_name ON students USING gin(to_tsvector('portuguese', name));
CREATE INDEX idx_students_class_group ON students(class_group);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_created_by ON students(created_by);
CREATE INDEX idx_students_birth_date ON students(birth_date);

CREATE INDEX idx_anamneses_student_id ON anamneses(student_id);
CREATE INDEX idx_anamneses_status ON anamneses(status);
CREATE INDEX idx_anamneses_expires_at ON anamneses(expires_at);
CREATE INDEX idx_anamneses_created_by ON anamneses(created_by);
CREATE INDEX idx_anamneses_created_at ON anamneses(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_offline_actions_user_id ON offline_actions(user_id);
CREATE INDEX idx_offline_actions_synced ON offline_actions(synced);
CREATE INDEX idx_offline_actions_timestamp ON offline_actions(timestamp);

CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anamneses_updated_at BEFORE UPDATE ON anamneses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para versioning de anamneses
CREATE OR REPLACE FUNCTION increment_anamnese_version()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Para nova anamnese, buscar a versão mais alta do aluno
        SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
        FROM anamneses 
        WHERE student_id = NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER anamnese_versioning BEFORE INSERT ON anamneses
    FOR EACH ROW EXECUTE FUNCTION increment_anamnese_version();

-- Trigger para expirar anamneses antigas
CREATE OR REPLACE FUNCTION expire_old_anamneses()
RETURNS TRIGGER AS $$
BEGIN
    -- Marcar anamneses antigas como expiradas quando uma nova é completada
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE anamneses 
        SET status = 'expired'
        WHERE student_id = NEW.student_id 
        AND id != NEW.id 
        AND status = 'completed';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER expire_anamneses AFTER UPDATE ON anamneses
    FOR EACH ROW EXECUTE FUNCTION expire_old_anamneses();

-- View para status de anamneses dos alunos
CREATE VIEW student_anamnese_status AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.class_group,
    a.id as latest_anamnese_id,
    a.created_at as latest_anamnese_date,
    CASE 
        WHEN a.id IS NULL THEN 'missing'
        WHEN a.expires_at < NOW() THEN 'expired'
        WHEN a.status = 'completed' THEN 'current'
        ELSE 'draft'
    END as anamnese_status,
    a.expires_at,
    CASE 
        WHEN a.expires_at IS NOT NULL THEN 
            EXTRACT(DAYS FROM (a.expires_at - NOW()))
        ELSE NULL
    END as days_until_expiry
FROM students s
LEFT JOIN LATERAL (
    SELECT * FROM anamneses 
    WHERE student_id = s.id 
    ORDER BY version DESC 
    LIMIT 1
) a ON true
WHERE s.status = 'active';

-- View para estatísticas de anamneses
CREATE VIEW anamnese_statistics AS
SELECT 
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_students,
    COUNT(DISTINCT CASE WHEN sas.anamnese_status = 'current' THEN s.id END) as current_anamneses,
    COUNT(DISTINCT CASE WHEN sas.anamnese_status = 'expired' THEN s.id END) as expired_anamneses,
    COUNT(DISTINCT CASE WHEN sas.anamnese_status = 'missing' THEN s.id END) as missing_anamneses,
    COUNT(DISTINCT CASE WHEN sas.days_until_expiry <= 30 AND sas.days_until_expiry > 0 THEN s.id END) as expiring_soon
FROM students s
LEFT JOIN student_anamnese_status sas ON s.id = sas.student_id;

-- Função para busca de alunos
CREATE OR REPLACE FUNCTION get_student_search(
    search_term TEXT DEFAULT '',
    class_filter TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    birth_date DATE,
    class_group TEXT,
    status student_status,
    latest_anamnese_date TIMESTAMP WITH TIME ZONE,
    anamnese_status TEXT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH filtered_students AS (
        SELECT s.*, sas.latest_anamnese_date, sas.anamnese_status
        FROM students s
        LEFT JOIN student_anamnese_status sas ON s.id = sas.student_id
        WHERE 
            (search_term = '' OR s.name ILIKE '%' || search_term || '%')
            AND (class_filter IS NULL OR s.class_group = class_filter)
            AND (status_filter IS NULL OR s.status::TEXT = status_filter)
    ),
    total_count AS (
        SELECT COUNT(*) as count FROM filtered_students
    )
    SELECT 
        fs.id,
        fs.name,
        fs.birth_date,
        fs.class_group,
        fs.status,
        fs.latest_anamnese_date,
        fs.anamnese_status,
        tc.count
    FROM filtered_students fs, total_count tc
    ORDER BY fs.name
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar anamneses expiradas e criar notificações
CREATE OR REPLACE FUNCTION check_anamnese_expiry()
RETURNS VOID AS $$
DECLARE
    expiring_record RECORD;
    expired_record RECORD;
BEGIN
    -- Notificar anamneses que expiram em 30 dias
    FOR expiring_record IN 
        SELECT s.id as student_id, s.name as student_name, a.expires_at, s.created_by
        FROM students s
        JOIN anamneses a ON s.id = a.student_id
        WHERE a.status = 'completed'
        AND a.expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
        AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.type = 'anamnese_expiring' 
            AND n.data->>'student_id' = s.id::TEXT
            AND n.created_at > NOW() - INTERVAL '7 days'
        )
    LOOP
        INSERT INTO notifications (type, title, message, data, user_id)
        VALUES (
            'anamnese_expiring',
            'Anamnese expirando em breve',
            'A anamnese do aluno ' || expiring_record.student_name || ' expira em breve.',
            jsonb_build_object(
                'student_id', expiring_record.student_id,
                'student_name', expiring_record.student_name,
                'expires_at', expiring_record.expires_at
            ),
            expiring_record.created_by
        );
    END LOOP;

    -- Marcar anamneses expiradas e notificar
    FOR expired_record IN 
        SELECT s.id as student_id, s.name as student_name, a.id as anamnese_id, s.created_by
        FROM students s
        JOIN anamneses a ON s.id = a.student_id
        WHERE a.status = 'completed'
        AND a.expires_at < NOW()
    LOOP
        -- Marcar como expirada
        UPDATE anamneses 
        SET status = 'expired' 
        WHERE id = expired_record.anamnese_id;

        -- Criar notificação
        INSERT INTO notifications (type, title, message, data, user_id)
        VALUES (
            'anamnese_expired',
            'Anamnese expirada',
            'A anamnese do aluno ' || expired_record.student_name || ' expirou.',
            jsonb_build_object(
                'student_id', expired_record.student_id,
                'student_name', expired_record.student_name
            ),
            expired_record.created_by
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificações em massa
CREATE OR REPLACE FUNCTION create_notification(
    notification_type TEXT,
    title TEXT,
    message TEXT,
    user_ids UUID[],
    data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    user_id UUID;
BEGIN
    FOREACH user_id IN ARRAY user_ids
    LOOP
        INSERT INTO notifications (type, title, message, data, user_id)
        VALUES (notification_type::notification_type, title, message, data, user_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para sincronizar ações offline
CREATE OR REPLACE FUNCTION sync_offline_actions(
    actions JSONB[]
)
RETURNS TABLE (
    success BOOLEAN,
    synced_count INTEGER,
    errors JSONB[]
) AS $$
DECLARE
    action JSONB;
    error_list JSONB[] := '{}';
    success_count INTEGER := 0;
BEGIN
    FOREACH action IN ARRAY actions
    LOOP
        BEGIN
            -- Processar cada ação baseada no tipo e entidade
            CASE action->>'entity'
                WHEN 'student' THEN
                    CASE action->>'type'
                        WHEN 'create' THEN
                            INSERT INTO students SELECT * FROM jsonb_populate_record(null::students, action->'data');
                        WHEN 'update' THEN
                            UPDATE students SET 
                                name = (action->'data'->>'name'),
                                updated_at = NOW()
                            WHERE id = (action->'data'->>'id')::UUID;
                        WHEN 'delete' THEN
                            DELETE FROM students WHERE id = (action->'data'->>'id')::UUID;
                    END CASE;
                WHEN 'anamnese' THEN
                    CASE action->>'type'
                        WHEN 'create' THEN
                            INSERT INTO anamneses (
                                id, student_id, version, status, medical_history, 
                                current_medications, allergies, physical_limitations, 
                                lifestyle_habits, objectives, medical_authorization, 
                                signature, lgpd_consent, created_by, expires_at, completed_at
                            ) SELECT 
                                COALESCE((action->'data'->>'id')::UUID, uuid_generate_v4()),
                                (action->'data'->>'student_id')::UUID,
                                COALESCE((action->'data'->>'version')::INTEGER, 1),
                                COALESCE((action->'data'->>'status')::anamnese_status, 'draft'),
                                COALESCE(action->'data'->'medical_history', '{}'),
                                COALESCE(action->'data'->'current_medications', '[]'),
                                COALESCE(action->'data'->'allergies', '[]'),
                                COALESCE(action->'data'->'physical_limitations', '[]'),
                                COALESCE(action->'data'->'lifestyle_habits', '{}'),
                                COALESCE(action->'data'->'objectives', '{}'),
                                action->'data'->'medical_authorization',
                                action->'data'->'signature',
                                action->'data'->'lgpd_consent',
                                (action->'data'->>'created_by')::UUID,
                                (action->'data'->>'expires_at')::TIMESTAMP WITH TIME ZONE,
                                (action->'data'->>'completed_at')::TIMESTAMP WITH TIME ZONE;
                        WHEN 'update' THEN
                            UPDATE anamneses SET 
                                status = (action->'data'->>'status')::anamnese_status,
                                updated_at = NOW()
                            WHERE id = (action->'data'->>'id')::UUID;
                    END CASE;
            END CASE;
            
            success_count := success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_list := error_list || jsonb_build_object(
                'action', action,
                'error', SQLERRM
            );
        END;
    END LOOP;
    
    RETURN QUERY SELECT TRUE, success_count, error_list;
END;
$$ LANGUAGE plpgsql;

-- Configurar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas RLS para students
CREATE POLICY "Users can view students they created" ON students
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Coordenadores and admins can view all students" ON students
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "Users can create students" ON students
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update students they created" ON students
    FOR UPDATE USING (created_by = auth.uid());

-- Políticas RLS para anamneses
CREATE POLICY "Users can view anamneses of their students" ON anamneses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students 
            WHERE id = student_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Coordenadores and admins can view all anamneses" ON anamneses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "Users can create anamneses for their students" ON anamneses
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM students 
            WHERE id = student_id AND created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update anamneses they created" ON anamneses
    FOR UPDATE USING (created_by = auth.uid());

-- Políticas RLS para notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Políticas RLS para offline_actions
CREATE POLICY "Users can view their own offline actions" ON offline_actions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own offline actions" ON offline_actions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own offline actions" ON offline_actions
    FOR UPDATE USING (user_id = auth.uid());

-- Políticas RLS para audit_logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Criar buckets de storage
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('avatars', 'avatars', true),
    ('student-photos', 'student-photos', false),
    ('medical-documents', 'medical-documents', false),
    ('signatures', 'signatures', false);

-- Políticas de storage
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view student photos of their students" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'student-photos' AND
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can upload student photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'student-photos' AND
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.created_by = auth.uid()
        )
    );

-- Função para executar verificação de anamneses expiradas diariamente
SELECT cron.schedule(
    'check-anamnese-expiry',
    '0 9 * * *', -- Todo dia às 9h
    'SELECT check_anamnese_expiry();'
);