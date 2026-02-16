import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, PlayCircle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface Video {
  id: string;
  titulo: string;
  descricao: string | null;
  url_youtube: string;
  duracao: number;
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

const MixVideo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase.from("videos").select("*").eq("id", id).single();
      if (data) setVideo(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const videoId = video ? extrairVideoId(video.url_youtube) : null;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-5 pb-20"
      >
        <button
          onClick={() => navigate("/mix")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
        ) : !video ? (
          <p className="text-sm text-muted-foreground text-center py-12">Vídeo não encontrado.</p>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Video player */}
            <div className="flex-1 min-w-0">
              {videoId && (
                <div className="relative w-full rounded-xl overflow-hidden aspect-video">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={video.titulo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="lg:w-72 xl:w-80 shrink-0 space-y-4">
              <div className="space-y-2">
                <h1 className="text-lg font-bold font-mono leading-snug">{video.titulo}</h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatarDuracao(video.duracao)}
                </div>
              </div>

              {video.descricao && (
                <div className="rounded-lg bg-secondary/50 border border-border p-4">
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {video.descricao}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default MixVideo;
