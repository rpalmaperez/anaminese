-- Allow professors to see all data (students and anamneses)
-- This migration modifies RLS policies to allow professors to view all data, not just their own

-- Drop existing policies for students table
DROP POLICY IF EXISTS "students_select_policy" ON students;
DROP POLICY IF EXISTS "students_update_policy" ON students;
DROP POLICY IF EXISTS "students_delete_policy" ON students;

-- Create updated policies for students table
CREATE POLICY "students_select_policy" ON students
    FOR SELECT USING (
        -- All authenticated users can see all students
        auth.uid() IS NOT NULL
    );

CREATE POLICY "students_update_policy" ON students
    FOR UPDATE USING (
        -- Users can update students they created
        created_by = auth.uid() OR
        -- Admins and coordenadores can update all students
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    ) WITH CHECK (
        -- Ensure created_by doesn't change to another user (unless admin/coordenador)
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "students_delete_policy" ON students
    FOR DELETE USING (
        -- Users can delete students they created
        created_by = auth.uid() OR
        -- Admins and coordenadores can delete all students
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

-- Drop existing policies for anamneses table
DROP POLICY IF EXISTS "anamneses_select_policy" ON anamneses;
DROP POLICY IF EXISTS "anamneses_update_policy" ON anamneses;
DROP POLICY IF EXISTS "anamneses_delete_policy" ON anamneses;

-- Create updated policies for anamneses table
CREATE POLICY "anamneses_select_policy" ON anamneses
    FOR SELECT USING (
        -- All authenticated users can see all anamneses
        auth.uid() IS NOT NULL
    );

CREATE POLICY "anamneses_update_policy" ON anamneses
    FOR UPDATE USING (
        -- Users can update anamneses they created
        created_by = auth.uid() OR
        -- Admins and coordenadores can update all anamneses
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    ) WITH CHECK (
        -- Ensure created_by doesn't change to another user (unless admin/coordenador)
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "anamneses_delete_policy" ON anamneses
    FOR DELETE USING (
        -- Users can delete anamneses they created
        created_by = auth.uid() OR
        -- Admins and coordenadores can delete all anamneses
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

-- Ensure RLS is still enabled on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;