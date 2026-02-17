
-- Create favorites table for audiobooks
CREATE TABLE public.audiobook_favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  audiobook_id UUID NOT NULL REFERENCES public.audiobooks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, audiobook_id)
);

ALTER TABLE public.audiobook_favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own favoritos" ON public.audiobook_favoritos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own favoritos" ON public.audiobook_favoritos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favoritos" ON public.audiobook_favoritos FOR DELETE USING (auth.uid() = user_id);
