
-- Add reply_to column to reference the message being replied to
ALTER TABLE public.mensagens ADD COLUMN reply_to uuid REFERENCES public.mensagens(id) ON DELETE SET NULL;

-- Add editado flag
ALTER TABLE public.mensagens ADD COLUMN editado boolean NOT NULL DEFAULT false;
