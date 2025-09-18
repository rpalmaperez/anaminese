-- Fix RLS policies to ensure proper user isolation
-- This migration fixes the RLS policies to ensure users can only see their own data

-- Drop existing policies for students table
DROP POLICY IF EXISTS "Users can view students they created" ON students;
DROP POLICY IF EXISTS "Users can create students" ON students;
DROP POLICY IF EXISTS "Users can update students they created" ON students;
DROP POLICY IF EXISTS "Users can delete students they created" ON students;

-- Create more specific policies for students table
CREATE POLICY "students_select_policy" ON students
    FOR SELECT USING (
        -- Users can see students they created
        created_by = auth.uid() OR
        -- Admins and coordenadores can see all students
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "students_insert_policy" ON students
    FOR INSERT WITH CHECK (
        -- Must be authenticated
        auth.uid() IS NOT NULL AND
        -- The created_by field must match the authenticated user
        created_by = auth.uid()
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
        -- Ensure created_by doesn't change to another user
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
DROP POLICY IF EXISTS "Users can view anamneses they created" ON anamneses;
DROP POLICY IF EXISTS "Users can create anamneses" ON anamneses;
DROP POLICY IF EXISTS "Users can update anamneses they created" ON anamneses;
DROP POLICY IF EXISTS "Users can delete anamneses they created" ON anamneses;

-- Create more specific policies for anamneses table
CREATE POLICY "anamneses_select_policy" ON anamneses
    FOR SELECT USING (
        -- Users can see anamneses they created
        created_by = auth.uid() OR
        -- Admins and coordenadores can see all anamneses
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "anamneses_insert_policy" ON anamneses
    FOR INSERT WITH CHECK (
        -- Must be authenticated
        auth.uid() IS NOT NULL AND
        -- The created_by field must match the authenticated user
        created_by = auth.uid()
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
        -- Ensure created_by doesn't change to another user
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

-- Ensure RLS is enabled on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add indexes to improve performance of RLS policies
CREATE INDEX IF NOT EXISTS idx_students_created_by ON students(created_by);
CREATE INDEX IF NOT EXISTS idx_anamneses_created_by ON anamneses(created_by);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);