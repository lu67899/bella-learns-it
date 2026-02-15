
-- Admin profile settings (single row for admin config)
CREATE TABLE public.admin_config (
  id integer PRIMARY KEY DEFAULT 1,
  nome text NOT NULL DEFAULT 'Admin',
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read admin config
CREATE POLICY "Public read admin_config" ON public.admin_config FOR SELECT USING (true);

-- Authenticated users can update (admin password protects the UI)
CREATE POLICY "Authenticated update admin_config" ON public.admin_config FOR UPDATE TO authenticated USING (true);

-- Insert initial row
INSERT INTO public.admin_config (id, nome) VALUES (1, 'Admin');

-- Trigger for updated_at
CREATE TRIGGER update_admin_config_updated_at
  BEFORE UPDATE ON public.admin_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
