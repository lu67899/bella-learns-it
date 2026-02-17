import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Video {
  id: string;
  titulo: string;
  descricao: string | null;
  url_youtube: string;
  duracao: number;
  categoria_id: string | null;
  ordem: number;
  created_at: string;
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
  const { session } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [categoryVideos, setCategoryVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase.from("videos").select("*").eq("id", id).single();
      if (data) {
        setVideo(data as Video);
        // Load sibling videos from same category (or all uncategorized)
        if (data.categoria_id) {
          const { data: siblings } = await supabase
            .from("videos")
            .select("*")
            .eq("categoria_id", data.categoria_id)
            .order("created_at", { ascending: false });
          if (siblings) setCategoryVideos(siblings as Video[]);
        } else {
          const { data: siblings } = await supabase
            .from("videos")
            .select("*")
            .is("categoria_id", null)
            .order("created_at", { ascending: false });
          if (siblings) setCategoryVideos(siblings as Video[]);
        }
      }
      setLoading(false);

      // Mark as watched
      if (session?.user?.id && id) {
        await supabase.from("video_assistido").upsert(
          { user_id: session.user.id, video_id: id },
          { onConflict: "user_id,video_id" }
        );
      }
    };
    load();
  }, [id, session?.user?.id]);

  const currentIndex = categoryVideos.findIndex(v => v.id === id);
  const prevVideo = currentIndex > 0 ? categoryVideos[currentIndex - 1] : null;
  const nextVideo = currentIndex < categoryVideos.length - 1 ? categoryVideos[currentIndex + 1] : null;

  const videoId = video ? extrairVideoId(video.url_youtube) : null;

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-5 pb-20"
      >
        <BackButton to="/mix" label="Voltar para Mix" />

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
              {/* Prev / Next buttons */}
              {categoryVideos.length > 1 && (
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => prevVideo && navigate(`/mix/${prevVideo.id}`)}
                    disabled={!prevVideo}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {currentIndex + 1}/{categoryVideos.length}
                  </span>
                  <button
                    onClick={() => nextVideo && navigate(`/mix/${nextVideo.id}`)}
                    disabled={!nextVideo}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </button>
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
