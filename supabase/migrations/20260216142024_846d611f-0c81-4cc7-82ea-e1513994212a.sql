
-- Add curso_id to certificado_solicitacoes to link certificates to courses
ALTER TABLE public.certificado_solicitacoes
ADD COLUMN curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL;

-- Add curso_nome for display convenience
ALTER TABLE public.certificado_solicitacoes
ADD COLUMN curso_nome TEXT;
