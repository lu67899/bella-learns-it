import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock } from "lucide-react";
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
        className="max-w-2xl mx-auto space-y-5 pb-20"
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
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold font-mono">{video.titulo}</h1>
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 mt-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatarDuracao(video.duracao)}
                </span>
              </div>
              {video.descricao && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {video.descricao}
                </p>
              )}
            </div>

            {videoId && (
              <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
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
        )}
      </motion.div>
    </Layout>
  );
};

export default MixVideo;
