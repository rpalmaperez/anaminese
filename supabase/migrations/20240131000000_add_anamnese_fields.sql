-- Adicionar campos faltantes na tabela anamneses
ALTER TABLE anamneses 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS physical_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_condition JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exams JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN anamneses.title IS 'Título da anamnese';
COMMENT ON COLUMN anamneses.physical_data IS 'Dados físicos como peso, altura, IMC';
COMMENT ON COLUMN anamneses.current_condition IS 'Condição atual incluindo sintomas e escala de dor';
COMMENT ON COLUMN anamneses.exams IS 'Informações sobre exames recentes e resultados';
COMMENT ON COLUMN anamneses.additional_notes IS 'Observações adicionais da anamnese';