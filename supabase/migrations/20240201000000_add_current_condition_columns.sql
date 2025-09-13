-- Adicionar colunas individuais para condição atual
ALTER TABLE anamneses 
ADD COLUMN IF NOT EXISTS current_symptoms TEXT,
ADD COLUMN IF NOT EXISTS symptom_duration TEXT,
ADD COLUMN IF NOT EXISTS pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
ADD COLUMN IF NOT EXISTS recent_exams TEXT,
ADD COLUMN IF NOT EXISTS exam_results TEXT;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN anamneses.current_symptoms IS 'Sintomas atuais do paciente';
COMMENT ON COLUMN anamneses.symptom_duration IS 'Duração dos sintomas';
COMMENT ON COLUMN anamneses.pain_scale IS 'Escala de dor de 0 a 10';
COMMENT ON COLUMN anamneses.recent_exams IS 'Exames recentes realizados';
COMMENT ON COLUMN anamneses.exam_results IS 'Resultados dos exames';