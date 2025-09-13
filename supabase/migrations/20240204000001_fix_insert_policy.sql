-- Fix INSERT policy for user registration
-- The previous policy requires auth.uid() = id, but during registration
-- the user is not yet authenticated, so we need to allow INSERT for any authenticated request

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "users_insert_authenticated" ON users;

-- Create a new INSERT policy that allows registration
-- This policy allows INSERT when:
-- 1. The user is authenticated (auth.uid() is not null)
-- 2. The ID being inserted matches the authenticated user's ID
-- 3. OR it's a service role operation
CREATE POLICY "users_insert_registration" ON users
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND (
            auth.uid() = id OR 
            auth.role() = 'service_role'
        )
    );

-- Also ensure we have a policy for anon users during registration
-- This is needed because during signup, the user might not be fully authenticated yet
CREATE POLICY "users_insert_signup" ON users
    FOR INSERT WITH CHECK (
        -- Allow insert if the ID matches a recently created auth user
        -- or if it's a service role
        id IS NOT NULL AND (
            auth.role() = 'service_role' OR
            EXISTS (
                SELECT 1 FROM auth.users au 
                WHERE au.id = users.id
            )
        )
    );