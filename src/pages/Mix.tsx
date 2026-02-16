import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, Clock } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface Video {
  id: string;
  titulo: string;
  descricao: string | null;
  url_youtube: string;
  duracao: number;
  ordem: number;
}

function extrairVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
}

function formatarDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos}min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const Mix = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("videos").select("*").order("ordem");
      if (data) setVideos(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl mx-auto space-y-6 pb-20">
        <motion.div variants={item}>
          <div className="flex items-center gap-2 mb-1">
            <PlayCircle className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold font-mono">Mix</h1>
          </div>
          <p className="text-sm text-muted-foreground">Videoaulas e conteúdos em vídeo</p>
        </motion.div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
        ) : videos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">Nenhum vídeo disponível ainda.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {videos.map((video) => {
              const videoId = extrairVideoId(video.url_youtube);
              return (
                <motion.div key={video.id} variants={item}>
                  <Link to={`/mix/${video.id}`} className="block group">
                    <div className="rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all">
                      {videoId && (
                        <div className="relative w-full aspect-video">
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                            alt={video.titulo}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                            <PlayCircle className="h-10 w-10 text-white/80 group-hover:text-white group-hover:scale-110 transition-all" />
                          </div>
                          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 text-[10px] bg-black/70 text-white/90 px-1.5 py-0.5 rounded font-mono">
                            <Clock className="h-2.5 w-2.5" />
                            {formatarDuracao(video.duracao)}
                          </span>
                        </div>
                      )}
                      <div className="p-3">
                        <h2 className="font-mono font-medium text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {video.titulo}
                        </h2>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Mix;
