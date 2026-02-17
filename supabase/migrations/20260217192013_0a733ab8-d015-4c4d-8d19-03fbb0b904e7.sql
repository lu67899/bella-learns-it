
ALTER TABLE public.admin_config
ADD COLUMN nome_app text NOT NULL DEFAULT 'Bella Space',
ADD COLUMN subtitulo text NOT NULL DEFAULT 'Plataforma de estudos';
