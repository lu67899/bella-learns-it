import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import BackButton from "@/components/BackButton";
import { Play as PlayIcon, Star, Clock, Search, X, ChevronRight, Film, Tv } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──
interface ContentItem {
  id: string;
  titulo: string;
  sinopse: string;
  capa_url: string;
  video_url: string;
  tipo: "filme" | "serie";
  genero: string;
  ano: number;
  duracao: string;
  nota: number;
}

// ── Mock data (será substituído pelo Baserow) ──
const MOCK_CONTENT: ContentItem[] = [
  {
    id: "1",
    titulo: "Aventuras no Código",
    sinopse: "Uma jornada épica pelo mundo da programação onde jovens desenvolvedores enfrentam bugs e desafios impossíveis.",
    capa_url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=600&fit=crop",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    tipo: "filme",
    genero: "Ação",
    ano: 2025,
    duracao: "1h 45min",
    nota: 4.5,
  },
  {
    id: "2",
    titulo: "O Mistério do Algoritmo",
    sinopse: "Quando um algoritmo misterioso começa a reescrever a realidade, uma equipe de hackers precisa decifrar o enigma.",
    capa_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    tipo: "filme",
    genero: "Terror",
    ano: 2024,
    duracao: "2h 10min",
    nota: 4.2,
  },
  {
    id: "3",
    titulo: "Bytes & Risos",
    sinopse: "Uma comédia sobre o dia a dia caótico de uma startup de tecnologia que não sabe o que está fazendo.",
    capa_url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=600&fit=crop",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    tipo: "serie",
    genero: "Comédia",
    ano: 2025,
    duracao: "8 eps",
    nota: 4.8,
  },
  {
    id: "4",
    titulo: "Matrix Reloaded: O Estudo",
    sinopse: "Drama intenso sobre estudantes que descobrem que sua universidade é uma simulação controlada por IA.",
    capa_url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=600&fit=crop",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    tipo: "serie",
    genero: "Drama",
    ano: 2024,
    duracao: "12 eps",
    nota: 4.6,
  },
  {
    id: "5",
    titulo: "Conexão Fatal",
    sinopse: "Um thriller de tirar o fôlego sobre uma rede de espionagem digital que ameaça governos do mundo inteiro.",
    capa_url: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=600&fit=crop",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    tipo: "filme",
    genero: "Ação",
    ano: 2025,
    duracao: "2h 05min",
    nota: 4.3,
  },
  {
    id: "6",
    titulo: "O Último Deploy",
    sinopse: "Quando o servidor principal cai durante a Black Friday, uma desenvolvedora tem 60 minutos para salvar tudo.",
    capa_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=600&fit=crop",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    tipo: "filme",
    genero: "Drama",
    ano: 2024,
    duracao: "1h 30min",
    nota: 4.7,
  },
  {
    id: "7",
    titulo: "Dev Nights",
    sinopse: "Série de comédia sobre programadores que só funcionam de madrugada e suas aventuras absurdas.",
    capa_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    tipo: "serie",
    genero: "Comédia",
    ano: 2025,
    duracao: "10 eps",
    nota: 4.4,
  },
  {
    id: "8",
    titulo: "A Sombra do Firewall",
    sinopse: "Um grupo de adolescentes descobre que o firewall da escola esconde segredos sombrios sobre seu passado.",
    capa_url: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=600&fit=crop",
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    tipo: "serie",
    genero: "Terror",
    ano: 2024,
    duracao: "6 eps",
    nota: 4.1,
  },
];

const GENEROS = ["Todos", "Ação", "Comédia", "Drama", "Terror"];
const TIPOS = [
  { value: "todos", label: "Tudo", icon: null },
  { value: "filme", label: "Filmes", icon: Film },
  { value: "serie", label: "Séries", icon: Tv },
];

// ── Star Rating ──
function Stars({ nota }: { nota: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3 w-3 fill-primary text-primary" />
      <span className="text-xs font-mono text-primary">{nota.toFixed(1)}</span>
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
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30">
            <PlayIcon className="h-5 w-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
        {/* Badge */}
        <Badge className="absolute top-2 left-2 text-[9px] font-mono bg-background/80 backdrop-blur-sm text-foreground border-border/50 px-1.5 py-0.5">
          {item.tipo === "filme" ? "Filme" : "Série"}
        </Badge>
      </div>
      <div className="mt-2 space-y-0.5 px-0.5">
        <p className="text-xs font-medium text-foreground truncate">{item.titulo}</p>
        <div className="flex items-center gap-2">
          <Stars nota={item.nota} />
          <span className="text-[10px] text-muted-foreground font-mono">{item.ano}</span>
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
      {/* Header */}
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
              {item.ano} · {item.genero} · {item.duracao}
            </p>
          </div>
        </div>
        <Stars nota={item.nota} />
      </div>

      {/* Video */}
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

      {/* Info */}
      <div className="px-4 py-4 space-y-2 border-t border-border/30">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-mono">
            {item.tipo === "filme" ? "Filme" : "Série"}
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono">
            {item.genero}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <Clock className="h-3 w-3" /> {item.duracao}
          </span>
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
  const [generoFilter, setGeneroFilter] = useState("Todos");
  const [selected, setSelected] = useState<ContentItem | null>(null);

  const filtered = useMemo(() => {
    return MOCK_CONTENT.filter((item) => {
      const matchTipo = tipoFilter === "todos" || item.tipo === tipoFilter;
      const matchGenero = generoFilter === "Todos" || item.genero === generoFilter;
      const matchSearch =
        !search ||
        item.titulo.toLowerCase().includes(search.toLowerCase()) ||
        item.sinopse.toLowerCase().includes(search.toLowerCase());
      return matchTipo && matchGenero && matchSearch;
    });
  }, [search, tipoFilter, generoFilter]);

  const groupedByGenero = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    filtered.forEach((item) => {
      if (!groups[item.genero]) groups[item.genero] = [];
      groups[item.genero].push(item);
    });
    return groups;
  }, [filtered]);

  // Featured = highest rated
  const featured = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => b.nota - a.nota);
    return sorted[0] || null;
  }, [filtered]);

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        <BackButton />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
            <PlayIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-foreground">Play</h1>
            <p className="text-[10px] text-muted-foreground/60 font-mono">Filmes e séries para assistir</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Buscar títulos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card/50 border-border/30 text-sm font-mono"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Type filter */}
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

          {/* Genre filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {GENEROS.map((g) => (
              <button
                key={g}
                onClick={() => setGeneroFilter(g)}
                className={`px-3 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition-all ${
                  generoFilter === g
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

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
                <Stars nota={featured.nota} />
                <span className="text-[10px] text-muted-foreground font-mono">{featured.duracao}</span>
              </div>
            </div>
          </motion.button>
        )}

        {/* Content rows by genre */}
        {Object.keys(groupedByGenero).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedByGenero).map(([genero, items]) => (
              <CategoryRow key={genero} title={genero} items={items} onSelect={setSelected} />
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
      </div>

      {/* Player overlay */}
      <AnimatePresence>
        {selected && (
          <PlayerView item={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
