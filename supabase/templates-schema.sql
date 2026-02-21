-- Templates Extension for Lovable Clone
-- Add this to your existing Supabase database

-- Templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'landing', 'dashboard', 'app', 'component'
  tags TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  is_official BOOLEAN DEFAULT false, -- Marked by admins
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT templates_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 200)
);

-- Template files table
CREATE TABLE IF NOT EXISTS public.template_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'file',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_file_per_template UNIQUE (template_id, path)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_author ON public.templates(author_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON public.templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON public.templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_template_files_template_id ON public.template_files(template_id);

-- GIN index for tags search
CREATE INDEX IF NOT EXISTS idx_templates_tags ON public.templates USING GIN(tags);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Anyone can view public templates"
  ON public.templates FOR SELECT
  USING (is_public = true OR auth.uid() = author_id);

CREATE POLICY "Authenticated users can create templates"
  ON public.templates FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their templates"
  ON public.templates FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their templates"
  ON public.templates FOR DELETE
  USING (auth.uid() = author_id);

-- RLS Policies for template_files
CREATE POLICY "Anyone can view files of public templates"
  ON public.template_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.templates
      WHERE templates.id = template_files.template_id
      AND (templates.is_public = true OR templates.author_id = auth.uid())
    )
  );

CREATE POLICY "Authors can insert files to their templates"
  ON public.template_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.templates
      WHERE templates.id = template_files.template_id
      AND templates.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update files of their templates"
  ON public.template_files FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.templates
      WHERE templates.id = template_files.template_id
      AND templates.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete files of their templates"
  ON public.template_files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.templates
      WHERE templates.id = template_files.template_id
      AND templates.author_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.templates
  SET usage_count = usage_count + 1
  WHERE id = template_uuid;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE public.templates IS 'Reusable project templates';
COMMENT ON TABLE public.template_files IS 'Files in templates';
COMMENT ON COLUMN public.templates.is_official IS 'Official templates by Lovable Clone team';
COMMENT ON COLUMN public.templates.usage_count IS 'Number of times template was used';
