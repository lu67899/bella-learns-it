import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import BackButton from "@/components/BackButton";
import { Play as PlayIcon, Star, Clock, Search, X, ChevronRight, Film, Tv, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

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

const TIPOS = [
  { value: "todos", label: "Tudo", icon: null },
  { value: "filme", label: "Filmes", icon: Film },
  { value: "serie", label: "Séries", icon: Tv },
];

// ── Star Rating (uses views as popularity) ──
function ViewsBadge({ views }: { views: number }) {
  if (!views) return null;
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3 w-3 fill-primary text-primary" />
      <span className="text-xs font-mono text-primary">{views}</span>
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

// ── Player Modal ──
function PlayerView({
  item,
  onClose,
}: {
  item: ContentItem;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-bold font-mono text-foreground truncate">{item.titulo}</p>
            <p className="text-[10px] text-muted-foreground font-mono">
              {item.categoria} · {item.idioma}
            </p>
          </div>
        </div>
        <ViewsBadge views={item.views} />
      </div>

      <div className="flex-1 flex items-center justify-center bg-black">
        <video
          src={item.video_url}
          controls
          autoPlay
          className="w-full h-full max-h-[70vh] object-contain"
          controlsList="nodownload"
          playsInline
        >
          Seu navegador não suporta vídeo.
        </video>
      </div>

      <div className="px-4 py-4 space-y-2 border-t border-border/30">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] font-mono">
            {item.tipo === "filme" ? "Filme" : "Série"}
          </Badge>
          {item.categoria.split(",").map((cat) => (
            <Badge key={cat.trim()} variant="outline" className="text-[10px] font-mono">
              {cat.trim()}
            </Badge>
          ))}
          {item.temporadas > 0 && (
            <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
              <Tv className="h-3 w-3" /> {item.temporadas} temporadas
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {item.sinopse}
        </p>
      </div>
    </motion.div>
  );
}

// ── Main Page ──
export default function PlayPage() {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [categoriaFilter, setCategoriaFilter] = useState("Todos");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        const { data, error: fnError } = await supabase.functions.invoke('baserow-content');
        if (fnError) throw fnError;
        setContent(data.items || []);
        setCategorias(data.categorias || []);
      } catch (err: any) {
        console.error('Error fetching content:', err);
        setError('Erro ao carregar conteúdo');
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, []);

  // Extract unique categories from content for filtering
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

  const groupedByCategoria = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    filtered.forEach((item) => {
      item.categoria.split(",").forEach((cat) => {
        const trimmed = cat.trim();
        if (trimmed) {
          if (!groups[trimmed]) groups[trimmed] = [];
          groups[trimmed].push(item);
        }
      });
    });
    return groups;
  }, [filtered]);

  // Featured = most views
  const featured = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.views - a.views);
    return sorted[0] || null;
  }, [filtered]);

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        <BackButton />

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
            <PlayIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-foreground">Play</h1>
            <p className="text-[10px] text-muted-foreground/60 font-mono">Filmes e séries para assistir</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Buscar títulos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card/50 border-border/30 text-sm font-mono"
          />
        </div>

        <div className="space-y-3">
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
          <PlayerView item={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
