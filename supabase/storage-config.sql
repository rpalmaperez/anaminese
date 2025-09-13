-- Configurações adicionais de Storage para o sistema de anamneses
-- Este arquivo complementa as configurações básicas do schema.sql

-- Políticas adicionais para medical-documents bucket
CREATE POLICY "Users can view medical documents of their students" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'medical-documents' AND
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.created_by = auth.uid()
        )
    );

CREATE POLICY "Coordenadores and admins can view all medical documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'medical-documents' AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "Users can upload medical documents for their students" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'medical-documents' AND
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update medical documents of their students" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'medical-documents' AND
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete medical documents of their students" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'medical-documents' AND
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.created_by = auth.uid()
        )
    );

-- Políticas para signatures bucket
CREATE POLICY "Users can view signatures of their students" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'signatures' AND
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.created_by = auth.uid()
        )
    );

CREATE POLICY "Coordenadores and admins can view all signatures" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'signatures' AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "Users can upload signatures for their students" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'signatures' AND
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.created_by = auth.uid()
        )
    );

-- Políticas adicionais para student-photos bucket
CREATE POLICY "Coordenadores and admins can view all student photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'student-photos' AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "Users can update student photos of their students" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'student-photos' AND
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete student photos of their students" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'student-photos' AND
        EXISTS (
            SELECT 1 FROM students s
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.created_by = auth.uid()
        )
    );

-- Configurações de MIME types permitidos
-- Estas configurações devem ser aplicadas via dashboard do Supabase ou API

/*
Configuração recomendada para os buckets:

1. avatars:
   - Público: true
   - MIME types: image/jpeg, image/png, image/webp
   - Tamanho máximo: 2MB
   - Transformações: resize automático para 200x200

2. student-photos:
   - Público: false
   - MIME types: image/jpeg, image/png, image/webp
   - Tamanho máximo: 5MB
   - Transformações: resize automático para 800x600

3. medical-documents:
   - Público: false
   - MIME types: application/pdf, image/jpeg, image/png
   - Tamanho máximo: 10MB
   - Criptografia: habilitada

4. signatures:
   - Público: false
   - MIME types: image/png, image/svg+xml
   - Tamanho máximo: 1MB
   - Transformações: otimização para assinatura
*/

-- Função para limpar arquivos órfãos (sem referência no banco)
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS TABLE(bucket_name text, deleted_count integer) AS $$
DECLARE
    rec RECORD;
    deleted_files integer := 0;
BEGIN
    -- Limpar fotos de estudantes órfãs
    FOR rec IN 
        SELECT name FROM storage.objects 
        WHERE bucket_id = 'student-photos'
        AND NOT EXISTS (
            SELECT 1 FROM students 
            WHERE id::text = (storage.foldername(name))[1]
        )
    LOOP
        DELETE FROM storage.objects 
        WHERE bucket_id = 'student-photos' AND name = rec.name;
        deleted_files := deleted_files + 1;
    END LOOP;
    
    RETURN QUERY SELECT 'student-photos'::text, deleted_files;
    
    -- Reset counter para próximo bucket
    deleted_files := 0;
    
    -- Limpar documentos médicos órfãos
    FOR rec IN 
        SELECT name FROM storage.objects 
        WHERE bucket_id = 'medical-documents'
        AND NOT EXISTS (
            SELECT 1 FROM students 
            WHERE id::text = (storage.foldername(name))[1]
        )
    LOOP
        DELETE FROM storage.objects 
        WHERE bucket_id = 'medical-documents' AND name = rec.name;
        deleted_files := deleted_files + 1;
    END LOOP;
    
    RETURN QUERY SELECT 'medical-documents'::text, deleted_files;
    
    -- Reset counter para próximo bucket
    deleted_files := 0;
    
    -- Limpar assinaturas órfãs
    FOR rec IN 
        SELECT name FROM storage.objects 
        WHERE bucket_id = 'signatures'
        AND NOT EXISTS (
            SELECT 1 FROM students 
            WHERE id::text = (storage.foldername(name))[1]
        )
    LOOP
        DELETE FROM storage.objects 
        WHERE bucket_id = 'signatures' AND name = rec.name;
        deleted_files := deleted_files + 1;
    END LOOP;
    
    RETURN QUERY SELECT 'signatures'::text, deleted_files;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agendar limpeza de arquivos órfãos semanalmente
SELECT cron.schedule(
    'cleanup-orphaned-files',
    '0 2 * * 0', -- Todo domingo às 2h
    'SELECT cleanup_orphaned_files();'
);

-- Função para obter estatísticas de uso de storage
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE(
    bucket_name text,
    file_count bigint,
    total_size_mb numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bucket_id::text,
        COUNT(*)::bigint,
        ROUND((SUM(metadata->>'size')::numeric / 1024 / 1024), 2)
    FROM storage.objects
    GROUP BY bucket_id
    ORDER BY bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;