
CREATE TABLE public.video_assistido (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  assistido_em timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.video_assistido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own video_assistido" ON public.video_assistido FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own video_assistido" ON public.video_assistido FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own video_assistido" ON public.video_assistido FOR DELETE USING (auth.uid() = user_id);
