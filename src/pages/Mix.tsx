import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PlayCircle, Clock, CheckCircle2, ChevronRight } from "lucide-react";
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

function VideoCard({ video, watched }: { video: Video; watched: boolean }) {
  const videoId = extrairVideoId(video.url_youtube);
  return (
    <Link to={`/mix/${video.id}`} className="block group">
      <div className={`rounded-lg overflow-hidden bg-card border transition-all shadow-sm ${watched ? "border-primary/30" : "border-border hover:border-primary/40 hover:shadow-md"}`}>
        {videoId && (
            <div className="relative w-full aspect-video">
            <img
              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
              alt={video.titulo}
              className={`w-full h-full object-cover ${watched ? "opacity-70" : ""}`}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/20 transition-colors">
              <PlayCircle className="h-9 w-9 text-white/80 group-hover:text-white group-hover:scale-110 transition-all drop-shadow-lg" />
            </div>
            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
              <Clock className="h-2.5 w-2.5" />
              {formatarDuracao(video.duracao)}
            </span>
            {watched && (
              <span className="absolute top-1.5 left-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary drop-shadow-md" />
              </span>
            )}
          </div>
        )}
        <div className="p-2.5">
          <h3 className="font-mono font-medium text-xs leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {video.titulo}
          </h3>
        </div>
      </div>
    </Link>
  );
}

function VideoSection({ title, videos, assistidos, onVerMais }: { title: string; videos: Video[]; assistidos: Set<string>; onVerMais: () => void }) {
  if (videos.length === 0) return null;
  const preview = videos.slice(0, 2);
  const hasMore = videos.length > 2;

  return (
    <motion.div variants={item} className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
      <h2 className="text-base font-bold font-mono flex items-center gap-1.5">
          {title.split(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u).map((part, i) =>
            /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(part)
              ? <span key={i} className="emoji-fix">{part}</span>
              : part ? <span key={i}>{part}</span> : null
          )}
        </h2>
        {hasMore && (
          <button
            onClick={onVerMais}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Ver todos ({videos.length})
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {preview.map((video) => (
          <VideoCard key={video.id} video={video} watched={assistidos.has(video.id)} />
        ))}
      </div>
    </motion.div>
  );
}

const Mix = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categorias, setCategorias] = useState<VideoCategoria[]>([]);
  const [assistidos, setAssistidos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

  const uncategorized = videos.filter(v => !v.categoria_id);
  const groupedByCategory = categorias
    .map(cat => ({
      ...cat,
      videos: videos.filter(v => v.categoria_id === cat.id),
    }))
    .filter(g => g.videos.length > 0);

  // If a category is expanded, show full list
  if (expandedCategory) {
    const group = groupedByCategory.find(g => g.id === expandedCategory);
    const isUncategorized = expandedCategory === "__uncategorized";
    const title = isUncategorized ? (categorias.length > 0 ? "Outros" : "Todos") : group?.nome || "";
    const categoryVideos = isUncategorized ? uncategorized : (group?.videos || []);

    return (
      <Layout>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-4 pb-20">
          <BackButton onClick={() => setExpandedCategory(null)} />
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold font-mono">{title}</h1>
            <span className="text-xs text-muted-foreground font-mono">({categoryVideos.length} vídeos)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryVideos.map((video) => (
              <VideoCard key={video.id} video={video} watched={assistidos.has(video.id)} />
            ))}
          </div>
        </motion.div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6 pb-20">
        <motion.div variants={item}>
          <div className="mb-5">
            <BackButton to="/" />
          </div>
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
              <VideoSection
                key={group.id}
                title={group.nome}
                videos={group.videos}
                assistidos={assistidos}
                onVerMais={() => setExpandedCategory(group.id)}
              />
            ))}
            {uncategorized.length > 0 && (
              <VideoSection
                title={categorias.length > 0 ? "Outros" : "Todos"}
                videos={uncategorized}
                assistidos={assistidos}
                onVerMais={() => setExpandedCategory("__uncategorized")}
              />
            )}
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Mix;
