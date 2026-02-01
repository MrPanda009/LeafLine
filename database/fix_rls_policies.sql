-- Fix RLS policies to allow users without KYC to submit complaints
-- Run this in your Supabase SQL Editor

-- Drop the old policy that requires KYC verification
DROP POLICY IF EXISTS "KYC verified users can insert complaints" ON public.complaints;

-- Create new policy that allows any authenticated user to insert complaints
CREATE POLICY "Authenticated users can insert complaints"
    ON public.complaints FOR INSERT
    TO authenticated
    WITH CHECK (
        reporter_id = auth.uid() AND
        (NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND is_blocked = true
        ) OR NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
        ))
    );

-- Update the SELECT policy to ensure users can see their own complaints
DROP POLICY IF EXISTS "Anyone can view complaints" ON public.complaints;

CREATE POLICY "Users can view all complaints"
    ON public.complaints FOR SELECT
    TO authenticated
    USING (true);

-- Also ensure profiles can be created by authenticated users
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

