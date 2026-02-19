
-- Add Xtream Codes configuration fields to admin_config
ALTER TABLE public.admin_config
ADD COLUMN IF NOT EXISTS play_source text NOT NULL DEFAULT 'baserow',
ADD COLUMN IF NOT EXISTS xtream_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS xtream_username text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS xtream_password text DEFAULT NULL;
