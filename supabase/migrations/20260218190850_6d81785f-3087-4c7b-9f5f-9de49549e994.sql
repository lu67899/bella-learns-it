
-- Add city and age to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cidade text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS idade integer DEFAULT NULL;

-- Add authorization code and weather API key to admin_config
ALTER TABLE public.admin_config ADD COLUMN IF NOT EXISTS codigo_autorizacao text DEFAULT NULL;
ALTER TABLE public.admin_config ADD COLUMN IF NOT EXISTS weather_api_key text DEFAULT NULL;
