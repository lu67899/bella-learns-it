import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, Clock } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
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
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
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
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-6 pb-20">
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
          <div className="space-y-4">
            {videos.map((video) => {
              const videoId = extrairVideoId(video.url_youtube);
              return (
                <motion.div key={video.id} variants={item}>
                  <Link to={`/mix/${video.id}`}>
                    <Card className="overflow-hidden bg-card border-border cursor-pointer hover:border-primary/30 transition-colors">
                      {videoId && (
                        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                            alt={video.titulo}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <PlayCircle className="h-14 w-14 text-white/90" />
                          </div>
                        </div>
                      )}
                      <div className="p-4 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="font-mono font-semibold text-sm">{video.titulo}</h2>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatarDuracao(video.duracao)}
                          </span>
                        </div>
                        {video.descricao && (
                          <p className="text-xs text-muted-foreground">{video.descricao}</p>
                        )}
                      </div>
                    </Card>
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
