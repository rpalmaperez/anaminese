-- Fix RLS recursion issue in users table policies
-- This migration removes problematic policies and creates simpler ones

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create simpler policies without recursion
-- Allow users to view their own profile using auth.uid() directly
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow service role to manage all users (for admin operations)
CREATE POLICY "service_role_all_users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert (for registration)
CREATE POLICY "users_insert_authenticated" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to check if user is admin (without recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users au
        JOIN users u ON au.id = u.id
        WHERE au.id = user_id AND u.role = 'admin'
    );
$$;

-- Create admin policy using the function
CREATE POLICY "admin_all_users" ON users
    FOR ALL USING (is_admin());