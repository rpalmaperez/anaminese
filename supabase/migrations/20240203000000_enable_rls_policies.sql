-- Enable Row Level Security (RLS) and create policies
-- This migration enables RLS on all tables and creates basic security policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Students table policies
CREATE POLICY "Users can view students they created" ON students
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "Users can create students" ON students
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        created_by = auth.uid()
    );

CREATE POLICY "Users can update students they created" ON students
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "Admins can delete students" ON students
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Anamneses table policies
CREATE POLICY "Users can view anamneses for their students" ON anamneses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM students s 
            WHERE s.id = student_id AND s.created_by = auth.uid()
        ) OR
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

CREATE POLICY "Users can create anamneses for their students" ON anamneses
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        created_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM students s 
            WHERE s.id = student_id AND s.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update anamneses they created" ON anamneses
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'coordenador')
        )
    );

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Offline actions table policies
CREATE POLICY "Users can manage their own offline actions" ON offline_actions
    FOR ALL USING (user_id = auth.uid());

-- Audit log table policies (read-only for users, admins can view all)
CREATE POLICY "Users can view audit logs for their actions" ON audit_log
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_log
    FOR INSERT WITH CHECK (true); -- Allow system triggers to insert

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon role for public access (if needed)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON users TO anon; -- Only for login/registration