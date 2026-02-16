import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, Clock, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Video {
  id: string;
  titulo: string;
  descricao: string | null;
  url_youtube: string;
  duracao: number;
  ordem: number;
  created_at: string;
  categoria_id: string | null;
}

interface VideoCategoria {
  id: string;
  nome: string;
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
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

function VideoRow({ title, videos, assistidos }: { title: string; videos: Video[]; assistidos: Set<string> }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [videos]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  if (videos.length === 0) return null;

  return (
    <motion.div variants={item} className="space-y-2.5">
      <h2 className="text-sm font-bold font-mono px-1">{title}</h2>
      <div className="relative group/row">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {videos.map((video) => {
            const videoId = extrairVideoId(video.url_youtube);
            const watched = assistidos.has(video.id);
            return (
              <Link key={video.id} to={`/mix/${video.id}`} className="block group shrink-0 w-[160px] sm:w-[200px]">
                <div className={`rounded-lg overflow-hidden bg-card border transition-all ${watched ? "border-primary/20" : "border-border hover:border-primary/30"}`}>
                  {videoId && (
                    <div className="relative w-full aspect-video">
                      <img
                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                        alt={video.titulo}
                        className={`w-full h-full object-cover ${watched ? "opacity-60" : ""}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                        <PlayCircle className="h-8 w-8 text-white/70 group-hover:text-white group-hover:scale-110 transition-all" />
                      </div>
                      <span className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[9px] bg-black/70 text-white/90 px-1 py-0.5 rounded font-mono">
                        <Clock className="h-2 w-2" />
                        {formatarDuracao(video.duracao)}
                      </span>
                      {watched && (
                        <span className="absolute top-1 left-1">
                          <CheckCircle2 className="h-4 w-4 text-primary drop-shadow-md" />
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-2">
                    <h3 className="font-mono font-medium text-[11px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {video.titulo}
                    </h3>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-5 w-5 text-foreground" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

const Mix = () => {
  const { session } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categorias, setCategorias] = useState<VideoCategoria[]>([]);
  const [assistidos, setAssistidos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [videosRes, catsRes, assistidosRes] = await Promise.all([
        supabase.from("videos").select("*").order("created_at", { ascending: false }),
        supabase.from("video_categorias").select("*").order("ordem"),
        session?.user?.id
          ? supabase.from("video_assistido").select("video_id").eq("user_id", session.user.id)
          : Promise.resolve({ data: [] }),
      ]);
      if (videosRes.data) setVideos(videosRes.data as Video[]);
      if (catsRes.data) setCategorias(catsRes.data);
      if (assistidosRes.data) {
        setAssistidos(new Set(assistidosRes.data.map((a: any) => a.video_id)));
      }
      setLoading(false);
    };
    load();
  }, [session?.user?.id]);

  // Group videos by category
  const uncategorized = videos.filter(v => !v.categoria_id);
  const groupedByCategory = categorias
    .map(cat => ({
      ...cat,
      videos: videos.filter(v => v.categoria_id === cat.id),
    }))
    .filter(g => g.videos.length > 0);

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6 pb-20">
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
          <div className="space-y-6">
            {groupedByCategory.map(group => (
              <VideoRow key={group.id} title={group.nome} videos={group.videos} assistidos={assistidos} />
            ))}
            {uncategorized.length > 0 && (
              <VideoRow title={categorias.length > 0 ? "Outros" : "Todos"} videos={uncategorized} assistidos={assistidos} />
            )}
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Mix;
