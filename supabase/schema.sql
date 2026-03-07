-- Lovable Clone Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (id is UUID; app uses crypto.randomUUID() for new projects)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT projects_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 200)
);

-- Project files table
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'file', -- 'file' or 'directory'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one file per path per project
  CONSTRAINT unique_file_per_project UNIQUE (project_id, path)
);

-- Deployments table
CREATE TABLE IF NOT EXISTS public.deployments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  deployment_id TEXT NOT NULL, -- Vercel deployment ID
  url TEXT NOT NULL,
  preview_url TEXT,
  production_url TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, BUILDING, READY, ERROR, CANCELED
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ready_at TIMESTAMP WITH TIME ZONE,
  
  -- Index for quick lookups
  CONSTRAINT deployments_deployment_id_unique UNIQUE (deployment_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON public.deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON public.deployments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for project_files
CREATE POLICY "Users can view files of their own projects"
  ON public.project_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert files to their own projects"
  ON public.project_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files of their own projects"
  ON public.project_files FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files of their own projects"
  ON public.project_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for deployments
CREATE POLICY "Users can view deployments of their own projects"
  ON public.deployments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = deployments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert deployments to their own projects"
  ON public.deployments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = deployments.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update deployments of their own projects"
  ON public.deployments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = deployments.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON public.project_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- ==============================
-- Public Beta: Invite Codes
-- ==============================
CREATE TABLE IF NOT EXISTS public.invite_codes (
  code TEXT PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_used_by TEXT
);

-- Server-only tables: enable RLS and do NOT add any policies.
-- This blocks anon/authenticated clients from reading/writing these tables.
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON public.invite_codes(active);

-- ==============================
-- Public Beta: Generation Logs (server-side only)
-- ==============================
CREATE TABLE IF NOT EXISTS public.generation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id TEXT,
  ip_hash TEXT,
  model_id TEXT,
  model_name TEXT,
  input_chars INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  est_cost_usd NUMERIC,
  actual_cost_usd NUMERIC,
  latency_ms INTEGER,
  schema_ok BOOLEAN,
  retries INTEGER,
  fallback_used BOOLEAN,
  error_code TEXT
);

ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

-- ==============================
-- Public Beta: Feature Flags (server-side only)
-- ==============================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Seed defaults (safe to re-run)
INSERT INTO public.feature_flags (key, enabled)
VALUES
  ('generate_enabled', TRUE),
  ('deploy_enabled', FALSE),
  ('invite_only_enabled', TRUE)
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON public.generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON public.generation_logs(user_id);
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.projects IS 'AI-generated projects';
COMMENT ON TABLE public.project_files IS 'Files belonging to projects';
COMMENT ON TABLE public.deployments IS 'Vercel deployment records';
