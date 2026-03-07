-- STEP 1: Run this in Supabase SQL Editor to remove RLS dependency issues
-- (Disable RLS on project_files so inserts work without auth.uid() in policies.)

ALTER TABLE public.project_files DISABLE ROW LEVEL SECURITY;
