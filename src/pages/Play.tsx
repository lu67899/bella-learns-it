import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/Layout";
import BackButton from "@/components/BackButton";
import { Play as PlayIcon, Star, Search, X, Film, Tv, Loader2, ChevronDown, List, RefreshCw, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { isNativeApp, fetchXtreamCatalogDirect, fetchXtreamEpisodesDirect } from "@/lib/xtreamClient";
import { playWithNativePlayer } from "@/lib/nativePlayer";

// ── Types ──
interface ContentItem {
  id: string;
  titulo: string;
  sinopse: string;
  capa_url: string;
  video_url: string;
  tipo: "filme" | "serie";
  categoria: string;
  idioma: string;
  views: number;
  temporadas: number;
}

interface Plataforma {
  nome: string;
  imagem: string;
}

interface Sessao {
  categoria: string;
  tipo: string;
}

interface Episode {
  id: string;
  nome: string;
  link: string;
  temporada: number;
  episodio: number;
  historico: string;
}

const TIPOS = [
  { value: "todos", label: "Tudo", icon: null },
  { value: "filme", label: "Filmes", icon: Film },
  { value: "serie", label: "Séries", icon: Tv },
];

// ── Star Rating ──
function ViewsBadge({ views }: { views: number }) {
  if (!views) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3 w-3 fill-primary text-primary" />
      <span className="text-xs font-mono text-primary">{views}</span>
    </div>
  );
}

// ── Platform Chips ──
function PlatformFilter({
  plataformas,
  selected,
  onSelect,
}: {
  plataformas: Plataforma[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  if (plataformas.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelect("Todas")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
          selected === "Todas"
            ? "bg-primary/15 text-primary ring-1 ring-primary/30 font-semibold"
            : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
        }`}
      >
        Todas
      </button>
      {plataformas.map((p) => (
        <button
          key={p.nome}
          onClick={() => onSelect(p.nome)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
            selected === p.nome
              ? "ring-1 ring-primary/30 bg-primary/10"
              : "bg-muted/30 hover:bg-muted/50"
          }`}
        >
          {p.imagem ? (
            <img src={p.imagem} alt={p.nome} className="h-5 w-5 rounded object-cover" />
          ) : null}
          <span className="text-[11px] font-mono">{p.nome}</span>
        </button>
      ))}
    </div>
  );
}

// ── Content Card ──
function ContentCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="group relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] text-left focus:outline-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-border/30 group-hover:ring-primary/50 transition-all duration-300">
        <img
          src={item.capa_url}
          alt={item.titulo}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
            <PlayIcon className="h-5 w-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
        <Badge className="absolute top-2 left-2 text-[9px] font-mono bg-background/80 backdrop-blur-sm text-foreground border-border/50 px-1.5 py-0.5">
          {item.tipo === "filme" ? "Filme" : "Série"}
        </Badge>
      </div>
      <div className="mt-2 space-y-0.5 px-0.5">
        <p className="text-xs font-medium text-foreground truncate">{item.titulo}</p>
        <div className="flex items-center gap-2">
          <ViewsBadge views={item.views} />
          <span className="text-[10px] text-muted-foreground font-mono">{item.idioma}</span>
        </div>
      </div>
    </motion.button>
  );
}

// ── Category Row ──
function CategoryRow({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: ContentItem[];
  onSelect: (item: ContentItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold font-mono text-foreground tracking-tight">{title}</h2>
        <span className="text-[10px] text-muted-foreground font-mono">{items.length} títulos</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {items.map((item) => (
          <ContentCard key={item.id} item={item} onClick={() => onSelect(item)} />
        ))}
      </div>
    </section>
  );
}

// ── Episodes List ──
function EpisodesList({
  episodes,
  onSelectEpisode,
  selectedEpisodeId,
}: {
  episodes: Episode[];
  onSelectEpisode: (ep: Episode) => void;
  selectedEpisodeId?: string;
}) {
  const seasons = useMemo(() => {
    const map = new Map<number, Episode[]>();
    episodes.forEach((ep) => {
      const list = map.get(ep.temporada) || [];
      list.push(ep);
      map.set(ep.temporada, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [episodes]);

  const [activeSeason, setActiveSeason] = useState(seasons[0]?.[0] || 1);
  const activeEpisodes = seasons.find(([s]) => s === activeSeason)?.[1] || [];

  return (
    <div className="space-y-3">
      {/* Season tabs */}
      {seasons.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {seasons.map(([season]) => (
            <button
              key={season}
              onClick={() => setActiveSeason(season)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition-all ${
                activeSeason === season
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              T{season}
            </button>
          ))}
        </div>
      )}

      {/* Episode list */}
      <div className="space-y-1.5 max-h-[40vh] overflow-y-auto scrollbar-none">
        {activeEpisodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => onSelectEpisode(ep)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
              selectedEpisodeId === ep.id
                ? "bg-primary/20 ring-1 ring-primary/30"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-mono text-white/60">{ep.episodio}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">
                E{ep.episodio} - {ep.nome}
              </p>
              <p className="text-[10px] text-white/40 font-mono">
                Temporada {ep.temporada}
              </p>
            </div>
            <PlayIcon className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Player Modal ──
function PlayerView({
  item,
  onClose,
  playSource,
}: {
  item: ContentItem;
  onClose: () => void;
  playSource: string;
}) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(item.video_url || '');
  const [selectedEpId, setSelectedEpId] = useState<string | undefined>();
  const [videoError, setVideoError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [useProxy, setUseProxy] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [nativePlayerActive, setNativePlayerActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch episodes for series
  useEffect(() => {
    if (item.tipo !== 'serie') return;
    setLoadingEps(true);

    if (playSource === 'xtream') {
      const seriesId = item.id.replace('series_', '');
      
      const fetchEps = isNativeApp()
        ? fetchXtreamEpisodesDirect(seriesId)
        : supabase.functions.invoke('xtream-content', {
            body: { action: 'episodes', series_id: seriesId },
          }).then(({ data }) => data);

      fetchEps.then((data: any) => {
        const eps = data?.episodes || [];
        setEpisodes(eps);
        if (eps.length > 0) {
          setActiveVideoUrl(eps[0].link);
          setSelectedEpId(eps[0].id);
          setShowEpisodes(true);
        }
      }).finally(() => setLoadingEps(false));
    } else {
      supabase.functions.invoke('baserow-content', {
        body: { action: 'episodes', serie_name: item.titulo },
      }).then(({ data }) => {
        const eps = data?.episodes || [];
        setEpisodes(eps);
        if (eps.length > 0) {
          setActiveVideoUrl(eps[0].link);
          setSelectedEpId(eps[0].id);
          setShowEpisodes(true);
        }
      }).finally(() => setLoadingEps(false));
    }
  }, [item, playSource]);

  // Reset error state when URL changes
  useEffect(() => {
    setVideoError(null);
    setRetryCount(0);
    setUseProxy(false);
    setVideoLoading(true);
    setNativePlayerActive(false);
  }, [activeVideoUrl]);

  // Launch native player on native apps for direct video URLs
  useEffect(() => {
    if (!activeVideoUrl || !isNativeApp()) return;
    const isDirect = /\.(mp4|mkv|webm|avi|mov|ts|m3u8)(\?.*)?$/i.test(activeVideoUrl);
    if (!isDirect) return;

    setNativePlayerActive(true);
    playWithNativePlayer(activeVideoUrl, item.titulo).then((success) => {
      if (!success) {
        // Native player not available, fall back to HTML video
        setNativePlayerActive(false);
      }
    });
  }, [activeVideoUrl, item.titulo]);

  const url = activeVideoUrl;
  const isDirectVideo = /\.(mp4|mkv|webm|avi|mov|ts|m3u8)(\?.*)?$/i.test(url);
  const proxyBase = `https://bold-block-8917.denysouzah7.workers.dev`;
  
  // Build video source with fallback strategy:
  // 1. Native app: try direct URL first, fallback to video-proxy edge function
  // 2. Web: always use Cloudflare Worker proxy for Xtream content
  const getVideoSrc = useCallback(() => {
    if (!isDirectVideo || !url) return url;
    
    // Web browser: always proxy Xtream content
    if (!isNativeApp()) {
      if (url.startsWith('http://') || playSource === 'xtream') {
        return `${proxyBase}?url=${encodeURIComponent(url)}`;
      }
      return url;
    }
    
    // Native app: try direct first, fallback to video-proxy edge function
    if (useProxy) {
      const supabaseUrl = (window as any).__SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL || 'https://fizcmvavzgoaznzindwl.supabase.co';
      return `${supabaseUrl}/functions/v1/video-proxy?url=${encodeURIComponent(url)}`;
    }
    
    return url;
  }, [url, isDirectVideo, useProxy, playSource, proxyBase]);

  const videoSrc = getVideoSrc();

  const handleVideoError = useCallback(() => {
    setVideoLoading(false);
    
    // Strategy: on first error in native app, try proxy fallback
    if (isNativeApp() && !useProxy && retryCount === 0) {
      console.log('[Player] Direct URL failed, trying proxy fallback...');
      setUseProxy(true);
      setRetryCount(1);
      return;
    }
    
    // If proxy also failed or we're on web, show error
    const errorMsg = isNativeApp()
      ? 'Não foi possível reproduzir este vídeo. O formato pode não ser suportado pelo dispositivo.'
      : 'Não foi possível reproduzir este vídeo. Verifique sua conexão.';
    setVideoError(errorMsg);
  }, [useProxy, retryCount]);

  const handleRetry = useCallback(() => {
    setVideoError(null);
    setVideoLoading(true);
    setRetryCount(0);
    setUseProxy(false);
    // Force re-mount by toggling a key
    setActiveVideoUrl(prev => {
      // Trigger re-render
      setTimeout(() => setActiveVideoUrl(url), 50);
      return '';
    });
  }, [url]);

  const handleVideoLoaded = useCallback(() => {
    setVideoLoading(false);
    setVideoError(null);
  }, []);

  const handleSelectEpisode = (ep: Episode) => {
    setActiveVideoUrl(ep.link);
    setSelectedEpId(ep.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 left-3 z-20 h-9 w-9 rounded-full flex items-center justify-center bg-black/70 backdrop-blur-sm text-white/80 hover:text-white active:scale-95 transition-all ring-1 ring-white/10"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Video Area */}
      <div className="w-full aspect-video bg-black flex items-center justify-center flex-shrink-0 relative">
        {nativePlayerActive ? (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <PlayIcon className="h-10 w-10 text-primary/70" />
            <p className="text-white/60 text-xs font-mono max-w-[280px]">
              Reproduzindo no player nativo...
            </p>
            <p className="text-white/30 text-[10px] font-mono">
              Selecione outro episódio abaixo
            </p>
          </div>
        ) : videoLoading && isDirectVideo && !videoError ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : null}
        
        {!nativePlayerActive && videoError ? (
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive/70" />
            <p className="text-white/60 text-xs font-mono max-w-[280px]">{videoError}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 text-primary text-xs font-mono hover:bg-primary/30 active:scale-95 transition-all ring-1 ring-primary/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Tentar novamente
            </button>
          </div>
        ) : !nativePlayerActive && isDirectVideo ? (
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            controls
            autoPlay
            className="w-full h-full object-contain"
            controlsList="nodownload"
            playsInline
            onError={handleVideoError}
            onLoadedData={handleVideoLoaded}
            onCanPlay={handleVideoLoaded}
          >
            Seu navegador não suporta vídeo.
          </video>
        ) : !nativePlayerActive && url ? (
          <iframe
            key={url}
            src={url}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
            style={{ border: 'none' }}
          />
        ) : !nativePlayerActive ? (
          <div className="flex flex-col items-center gap-2">
            <Film className="h-8 w-8 text-white/20" />
            <p className="text-white/30 text-xs font-mono">Nenhum link disponível</p>
          </div>
        ) : null}
      </div>

      {/* Info + Episodes Panel */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        <h2 className="text-base font-bold text-white leading-tight">{item.titulo}</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-primary/20 text-primary ring-1 ring-primary/30">
            {item.tipo === "filme" ? "Filme" : "Série"}
          </span>
          {item.idioma && (
            <span className="text-[10px] font-mono text-white/50">{item.idioma}</span>
          )}
          {item.temporadas > 0 && (
            <span className="text-[10px] text-white/50 font-mono flex items-center gap-1">
              <Tv className="h-3 w-3" /> {item.temporadas} temp.
            </span>
          )}
          <ViewsBadge views={item.views} />
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 flex-wrap">
          {item.categoria.split(",").map((cat) => (
            <span key={cat.trim()} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/50 ring-1 ring-white/10">
              {cat.trim()}
            </span>
          ))}
        </div>

        {item.sinopse && (
          <p className="text-xs text-white/40 leading-relaxed">
            {item.sinopse}
          </p>
        )}

        {/* Episodes section for series */}
        {item.tipo === 'serie' && (
          <div className="pt-2 border-t border-white/5">
            <button
              onClick={() => setShowEpisodes(!showEpisodes)}
              className="flex items-center gap-2 w-full py-2"
            >
              <List className="h-4 w-4 text-white/60" />
              <span className="text-sm font-mono font-semibold text-white/80">
                Episódios {episodes.length > 0 && `(${episodes.length})`}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-white/40 ml-auto transition-transform ${showEpisodes ? 'rotate-180' : ''}`} />
            </button>

            {loadingEps && (
              <div className="flex items-center gap-2 py-4 justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-white/40 font-mono">Carregando episódios...</span>
              </div>
            )}

            {showEpisodes && !loadingEps && episodes.length > 0 && (
              <EpisodesList
                episodes={episodes}
                onSelectEpisode={handleSelectEpisode}
                selectedEpisodeId={selectedEpId}
              />
            )}

            {!loadingEps && episodes.length === 0 && (
              <p className="text-xs text-white/30 font-mono py-2">Nenhum episódio encontrado</p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ──
export default function PlayPage() {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [categoriaFilter, setCategoriaFilter] = useState("Todos");
  const [plataformaFilter, setPlataformaFilter] = useState("Todas");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);

  const [playSource, setPlaySource] = useState<string>("baserow");

  const PAGE_SIZE = 500;

  const fetchPage = async (source: string, offset: number, isFirst: boolean) => {
    let data: any;

    if (source === "xtream" && isNativeApp()) {
      data = await fetchXtreamCatalogDirect(PAGE_SIZE, offset);
    } else {
      const functionName = source === "xtream" ? "xtream-content" : "baserow-content";
      const body = source === "xtream" ? { limit: PAGE_SIZE, offset } : undefined;
      const { data: fnData, error: fnError } = await supabase.functions.invoke(functionName, { body });
      if (fnError) throw fnError;
      data = fnData;
    }

    if (data?.error) {
      setError(data.error);
    }

    const newItems: ContentItem[] = data?.items || [];
    const total = data?.total || newItems.length;

    if (isFirst) {
      setContent(newItems);
      setCategorias(data?.categorias || []);
      setSessoes(data?.sessoes || []);
      setPlataformas(data?.plataformas || []);
    } else {
      setContent(prev => [...prev, ...newItems]);
    }

    setTotalItems(total);
    setLoadedCount(prev => (isFirst ? newItems.length : prev + newItems.length));

    return { total, loaded: newItems.length };
  };

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        const { data: configData } = await supabase.from("admin_config").select("play_source").eq("id", 1).single();
        const source = (configData as any)?.play_source || "baserow";
        setPlaySource(source);

        // For non-xtream sources, load everything at once (they're smaller)
        if (source !== "xtream") {
          await fetchPage(source, 0, true);
          return;
        }

        // For xtream, load first page then progressively load the rest
        const { total, loaded } = await fetchPage(source, 0, true);

        // Auto-load remaining pages in background
        if (loaded < total) {
          setLoadingMore(true);
          let currentOffset = loaded;
          while (currentOffset < total) {
            await fetchPage(source, currentOffset, false);
            currentOffset += PAGE_SIZE;
            // Yield to UI thread
            await new Promise(r => setTimeout(r, 50));
          }
          setLoadingMore(false);
        }
      } catch (err: any) {
        console.error('Error fetching content:', err);
        setError('Erro ao carregar conteúdo');
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, []);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    content.forEach((item) => {
      item.categoria.split(",").forEach((c) => {
        const trimmed = c.trim();
        if (trimmed) cats.add(trimmed);
      });
    });
    return ["Todos", ...Array.from(cats).sort()];
  }, [content]);

  const filtered = useMemo(() => {
    return content.filter((item) => {
      const matchTipo = tipoFilter === "todos" || item.tipo === tipoFilter;
      const matchCategoria = categoriaFilter === "Todos" || item.categoria.includes(categoriaFilter);
      const matchSearch =
        !search ||
        item.titulo.toLowerCase().includes(search.toLowerCase()) ||
        item.sinopse.toLowerCase().includes(search.toLowerCase());
      return matchTipo && matchCategoria && matchSearch;
    });
  }, [search, tipoFilter, categoriaFilter, content]);

  // Use sessões to define the section order/grouping
  const groupedByCategoria = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};

    // If we have sessões, use them to define order and filter by tipo
    if (sessoes.length > 0) {
      sessoes.forEach((sessao) => {
        const key = sessao.categoria;
        const tipoLower = (sessao.tipo || '').toLowerCase();
        const sessaoTipo = tipoLower === 'série' || tipoLower === 'serie' ? 'serie' : 'filme';

        const matching = filtered.filter((item) => {
          const itemCats = item.categoria.split(",").map(c => c.trim().toLowerCase());
          const matchCat = itemCats.includes(key.toLowerCase());
          const matchTipo = item.tipo === sessaoTipo;
          return matchCat && matchTipo;
        });

        if (matching.length > 0) {
          const label = `${key} (${sessao.tipo})`;
          groups[label] = matching;
        }
      });
    }

    // Also add general category groups for items not in sessions
    filtered.forEach((item) => {
      item.categoria.split(",").forEach((cat) => {
        const trimmed = cat.trim();
        if (trimmed) {
          // Check if already in a session group
          const inSession = sessoes.some(s => s.categoria.toLowerCase() === trimmed.toLowerCase());
          if (!inSession) {
            if (!groups[trimmed]) groups[trimmed] = [];
            if (!groups[trimmed].find(i => i.id === item.id)) {
              groups[trimmed].push(item);
            }
          }
        }
      });
    });

    return groups;
  }, [filtered, sessoes]);

  // Featured = most views
  const featured = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.views - a.views);
    return sorted[0] || null;
  }, [filtered]);

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        <div className="mb-5">
          <BackButton />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
            <PlayIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-foreground">Play</h1>
            <p className="text-[10px] text-muted-foreground/60 font-mono">Filmes e séries para assistir</p>
          </div>
        </div>

        <form role="presentation" autoComplete="off" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Buscar títulos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-card/50 border-border/30 text-sm font-mono"
            />
          </div>
        </form>

        <div className="space-y-3">
          {/* Tipo filter */}
          <div className="flex gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTipoFilter(t.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  tipoFilter === t.value
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30 font-semibold"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {t.icon && <t.icon className="h-3 w-3" />}
                {t.label}
              </button>
            ))}
          </div>

          {/* Platform filter */}
          <PlatformFilter
            plataformas={plataformas}
            selected={plataformaFilter}
            onSelect={setPlataformaFilter}
          />

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {allCategories.map((g) => (
              <button
                key={g}
                onClick={() => setCategoriaFilter(g)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition-all ${
                  categoriaFilter === g
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-mono">Carregando catálogo...</p>
            {totalItems > 0 && (
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                {loadedCount} de {totalItems} títulos
              </p>
            )}
          </div>
        )}

        {/* Loading more in background */}
        {loadingMore && !loading && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-mono">
              Carregando mais... {loadedCount}/{totalItems}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <p className="text-sm text-destructive font-mono">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Featured Hero */}
            {featured && !search && (
              <motion.button
                onClick={() => setSelected(featured)}
                className="relative w-full aspect-video rounded-2xl overflow-hidden ring-1 ring-border/30 group text-left"
                whileTap={{ scale: 0.98 }}
              >
                <img
                  src={featured.capa_url}
                  alt={featured.titulo}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono">
                    ⭐ Destaque
                  </Badge>
                  <h2 className="text-lg font-bold font-mono text-foreground">{featured.titulo}</h2>
                  <p className="text-xs text-muted-foreground line-clamp-2">{featured.sinopse}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-semibold">
                      <PlayIcon className="h-3.5 w-3.5" /> Assistir
                    </div>
                    <ViewsBadge views={featured.views} />
                    <span className="text-[10px] text-muted-foreground font-mono">{featured.idioma}</span>
                  </div>
                </div>
              </motion.button>
            )}

            {Object.keys(groupedByCategoria).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedByCategoria).map(([cat, items]) => (
                  <CategoryRow key={cat} title={cat} items={items} onSelect={setSelected} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                  <Film className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground font-mono">Nenhum título encontrado</p>
                <p className="text-[10px] text-muted-foreground/50 font-mono">Tente outro filtro ou busca</p>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <PlayerView item={selected} onClose={() => setSelected(null)} playSource={playSource} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
