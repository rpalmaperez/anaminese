-- Fix permissions for anonymous users during registration
-- Grant necessary permissions for user registration

-- Grant INSERT permission to anon role for users table (needed for registration)
GRANT INSERT ON users TO anon;

-- Also ensure authenticated users have full access
GRANT ALL ON users TO authenticated;

-- Drop the conflicting policies and create a simpler one for registration
DROP POLICY IF EXISTS "users_insert_registration" ON users;
DROP POLICY IF EXISTS "users_insert_signup" ON users;

-- Create a single, simple INSERT policy for registration
-- This allows INSERT when the ID matches an existing auth user
CREATE POLICY "users_insert_during_registration" ON users
    FOR INSERT WITH CHECK (
        -- Allow if it's a service role
        auth.role() = 'service_role' OR
        -- Allow if the user exists in auth.users (just created during signup)
        EXISTS (
            SELECT 1 FROM auth.users au 
            WHERE au.id = users.id
        )
    );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;