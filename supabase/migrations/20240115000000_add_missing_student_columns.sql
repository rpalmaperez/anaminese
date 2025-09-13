-- Add missing columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS medications TEXT;

-- Create index for CPF for better performance
CREATE INDEX IF NOT EXISTS idx_students_cpf ON students(cpf);

-- Add comment to explain the columns
COMMENT ON COLUMN students.cpf IS 'Brazilian CPF document number';
COMMENT ON COLUMN students.gender IS 'Student gender';
COMMENT ON COLUMN students.allergies IS 'Student allergies information';
COMMENT ON COLUMN students.medical_conditions IS 'Student medical conditions';
COMMENT ON COLUMN students.medications IS 'Student current medications';