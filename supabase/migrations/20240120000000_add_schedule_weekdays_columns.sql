-- Add schedule and weekdays columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS schedule TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS weekdays TEXT;

-- Add comments to explain the columns
COMMENT ON COLUMN students.schedule IS 'Student class schedule (e.g., "08:00-12:00")';
COMMENT ON COLUMN students.weekdays IS 'Student class weekdays (e.g., "segunda-quarta")';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_schedule ON students(schedule);
CREATE INDEX IF NOT EXISTS idx_students_weekdays ON students(weekdays);