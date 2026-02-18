import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Headphones, Play, Pause, ChevronRight, Clock, User, BookOpen, Heart, RotateCcw } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { toast } from "sonner";

interface Categoria {
  id: string;
  nome: string;
  icone: string;
}

interface Audiobook {
  id: string;
  titulo: string;
  autor: string | null;
  descricao: string | null;
  capa_url: string | null;
  audio_url: string;
  duracao_segundos: number;
  categoria_id: string | null;
  ordem: number;
}

interface Capitulo {
  id: string;
  audiobook_id: string;
  titulo: string;
  descricao: string | null;
  audio_url: string;
  duracao_segundos: number;
  ordem: number;
}

type View = "categories" | "books" | "detail";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
};

const Audiobooks = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const player = useAudioPlayer();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [view, setView] = useState<View>("categories");
  const [selectedCategory, setSelectedCategory] = useState<Categoria | null>(null);
  const [selectedBook, setSelectedBook] = useState<Audiobook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, bookRes, capRes] = await Promise.all([
        supabase.from("audiobook_categorias").select("*").order("ordem"),
        supabase.from("audiobooks").select("*").order("ordem"),
        supabase.from("audiobook_capitulos").select("*").order("ordem"),
      ]);
      if (catRes.data) setCategorias(catRes.data);
      if (bookRes.data) setAudiobooks(bookRes.data);
      if (capRes.data) setCapitulos(capRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const resetProgress = async (bookId: string) => {
    if (!session?.user?.id) return;
    await supabase.from("audiobook_progresso").delete().eq("user_id", session.user.id).eq("audiobook_id", bookId);
    player.setProgressos((prev) => prev.filter((p) => p.audiobook_id !== bookId));
    toast.success("Progresso resetado");
  };

  const getCapProgress = (capId: string) => {
    const p = player.progressos.find((pr) => pr.capitulo_id === capId);
    if (!p) return { percent: 0, concluido: false };
    const cap = capitulos.find((c) => c.id === capId);
    if (!cap || !cap.duracao_segundos) return { percent: 0, concluido: p.concluido };
    return { percent: Math.min(100, (p.posicao_segundos / cap.duracao_segundos) * 100), concluido: p.concluido };
  };

  const getBookTotalDuration = (bookId: string) => {
    return capitulos.filter((c) => c.audiobook_id === bookId).reduce((sum, c) => sum + (c.duracao_segundos || 0), 0);
  };

  const getBookProgress = (bookId: string) => {
    const caps = capitulos.filter((c) => c.audiobook_id === bookId);
    if (caps.length === 0) return 0;
    const completed = caps.filter((c) => player.progressos.find((p) => p.capitulo_id === c.id)?.concluido).length;
    return Math.round((completed / caps.length) * 100);
  };

  const handlePlayCapitulo = (cap: Capitulo) => {
    const book = audiobooks.find((b) => b.id === cap.audiobook_id);
    if (!book) return;
    const allCaps = capitulos.filter((c) => c.audiobook_id === cap.audiobook_id).sort((a, b) => a.ordem - b.ordem);
    player.playCapitulo(cap, allCaps, book);
  };

  const handleBack = () => {
    if (view === "detail") setView("books");
    else if (view === "books") { setView("categories"); setSelectedCategory(null); }
    else navigate("/", { state: { openSidebar: true } });
  };

  const selectCategory = (cat: Categoria) => { setSelectedCategory(cat); setView("books"); };
  const selectBook = (book: Audiobook) => { setSelectedBook(book); setView("detail"); };

  const booksInCategory = selectedCategory
    ? selectedCategory.id === "__uncategorized__"
      ? audiobooks.filter((b) => !b.categoria_id)
      : selectedCategory.id === "__favoritos__"
        ? audiobooks.filter((b) => player.favoritos.includes(b.id))
        : audiobooks.filter((b) => b.categoria_id === selectedCategory.id)
    : [];

  const bookCapitulos = selectedBook
    ? capitulos.filter((c) => c.audiobook_id === selectedBook.id).sort((a, b) => a.ordem - b.ordem)
    : [];

  const uncategorized = audiobooks.filter((b) => !b.categoria_id);
  const backLabel = view === "detail" ? selectedCategory?.nome || "Voltar" : view === "books" ? "Categorias" : "Voltar";

  const hasPlayer = !!player.playingCapitulo;

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className={`max-w-2xl mx-auto space-y-6 ${hasPlayer ? "pb-32" : ""}`}>
        {/* Header */}
        <motion.div variants={item}>
          <div className="mb-4">
            <BackButton onClick={handleBack} label={backLabel} />
          </div>

          {view === "categories" && (
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Headphones className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-mono">Audiobooks</h1>
                <p className="text-xs text-muted-foreground">Escolha uma categoria para começar</p>
              </div>
            </div>
          )}

          {view === "books" && selectedCategory && (
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <span className="text-lg">{selectedCategory.icone}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold font-mono">{selectedCategory.nome}</h1>
                <p className="text-xs text-muted-foreground">{booksInCategory.length} título{booksInCategory.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          )}
        </motion.div>

        {loading ? (
          <motion.div variants={item} className="text-center py-12">
            <p className="text-sm text-muted-foreground font-mono">Carregando...</p>
          </motion.div>
        ) : view === "categories" ? (
          <CategoriesView
            categorias={categorias}
            audiobooks={audiobooks}
            uncategorized={uncategorized}
            favoritosCount={player.favoritos.length}
            onSelect={selectCategory}
          />
        ) : view === "books" ? (
          <BooksListView
            books={booksInCategory}
            capitulos={capitulos}
            favoritos={player.favoritos}
            getBookTotalDuration={getBookTotalDuration}
            getBookProgress={getBookProgress}
            onSelect={selectBook}
            onToggleFavorite={player.toggleFavorite}
          />
        ) : view === "detail" && selectedBook ? (
          <BookDetailView
            book={selectedBook}
            capitulos={bookCapitulos}
            playingCapitulo={player.playingCapitulo}
            isPlaying={player.isPlaying}
            isFavorite={player.favoritos.includes(selectedBook.id)}
            getCapProgress={getCapProgress}
            getBookProgress={getBookProgress}
            onPlayCapitulo={handlePlayCapitulo}
            onToggleFavorite={() => player.toggleFavorite(selectedBook.id)}
            onResetProgress={() => resetProgress(selectedBook.id)}
          />
        ) : null}
      </motion.div>
    </Layout>
  );
};

// ── Categories Grid ──
function CategoriesView({ categorias, audiobooks, uncategorized, favoritosCount, onSelect }: {
  categorias: Categoria[];
  audiobooks: Audiobook[];
  uncategorized: Audiobook[];
  favoritosCount: number;
  onSelect: (cat: Categoria) => void;
}) {
  if (categorias.length === 0 && uncategorized.length === 0 && favoritosCount === 0) {
    return (
      <motion.div variants={item} className="text-center py-12">
        <Headphones className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground font-mono">Nenhum audiobook disponível ainda</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {favoritosCount > 0 && (
        <motion.div
          variants={item}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect({ id: "__favoritos__", nome: "Favoritos", icone: "❤️" })}
          className="group relative cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-red-400/40 hover:shadow-lg"
        >
          <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-500/5">
            <div className="w-full h-full flex items-center justify-center"><Heart className="h-10 w-10 text-red-400/60" /></div>
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm">❤️</span>
              <p className="font-mono text-sm font-semibold">Favoritos</p>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">{favoritosCount} título{favoritosCount !== 1 ? "s" : ""}</p>
          </div>
        </motion.div>
      )}

      {categorias.map((cat) => {
        const count = audiobooks.filter((b) => b.categoria_id === cat.id).length;
        const coverBook = audiobooks.find((b) => b.categoria_id === cat.id && b.capa_url);
        return (
          <motion.div
            key={cat.id}
            variants={item}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(cat)}
            className="group relative cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg"
          >
            <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
              {coverBook?.capa_url ? (
                <img src={coverBook.capa_url} alt={cat.nome} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">{cat.icone}</span></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{cat.icone}</span>
                <p className="font-mono text-sm font-semibold truncate">{cat.nome}</p>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">{count} {count === 1 ? "título" : "títulos"}</p>
            </div>
            <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="h-3.5 w-3.5 text-foreground" />
            </div>
          </motion.div>
        );
      })}

      {uncategorized.length > 0 && (
        <motion.div
          variants={item}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect({ id: "__uncategorized__", nome: "Outros", icone: "📚" })}
          className="group relative cursor-pointer rounded-2xl border border-border bg-card overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg"
        >
          <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            <div className="w-full h-full flex items-center justify-center"><span className="text-4xl">📚</span></div>
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm">📚</span>
              <p className="font-mono text-sm font-semibold">Outros</p>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">{uncategorized.length} título{uncategorized.length !== 1 ? "s" : ""}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Books List ──
function BooksListView({ books, capitulos, favoritos, getBookTotalDuration, getBookProgress, onSelect, onToggleFavorite }: {
  books: Audiobook[];
  capitulos: Capitulo[];
  favoritos: string[];
  getBookTotalDuration: (id: string) => number;
  getBookProgress: (id: string) => number;
  onSelect: (book: Audiobook) => void;
  onToggleFavorite: (id: string) => void;
}) {
  if (books.length === 0) {
    return (
      <motion.div variants={item} className="text-center py-12">
        <Headphones className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground font-mono">Nenhum título nesta categoria</p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-3">
      {books.map((book) => {
        const totalDur = getBookTotalDuration(book.id);
        const progress = getBookProgress(book.id);
        const chapCount = capitulos.filter((c) => c.audiobook_id === book.id).length;
        const isFav = favoritos.includes(book.id);
        return (
          <motion.div
            key={book.id}
            variants={item}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="cursor-pointer shrink-0" onClick={() => onSelect(book)}>
              {book.capa_url ? (
                <img src={book.capa_url} alt={book.titulo} className="h-20 w-16 rounded-lg object-cover shadow-sm" />
              ) : (
                <div className="flex h-20 w-16 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(book)}>
              <p className="font-mono text-sm font-semibold truncate">{book.titulo}</p>
              {book.autor && (
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <User className="h-3 w-3" /> {book.autor}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {chapCount > 0 && <span className="text-[10px] text-muted-foreground font-mono">{chapCount} cap.</span>}
                {totalDur > 0 && (
                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                    <Clock className="h-3 w-3" /> {formatDuration(totalDur)}
                  </span>
                )}
              </div>
              {progress > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 max-w-[120px] h-1 rounded-full bg-secondary/50 overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  {progress === 100 && <span className="text-[9px] font-mono text-primary">✓</span>}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(book.id); }}
            >
              <Heart className={`h-4 w-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Book Detail View ──
function BookDetailView({ book, capitulos, playingCapitulo, isPlaying, isFavorite, getCapProgress, getBookProgress, onPlayCapitulo, onToggleFavorite, onResetProgress }: {
  book: Audiobook;
  capitulos: Capitulo[];
  playingCapitulo: any;
  isPlaying: boolean;
  isFavorite: boolean;
  getCapProgress: (id: string) => { percent: number; concluido: boolean };
  getBookProgress: (id: string) => number;
  onPlayCapitulo: (cap: Capitulo) => void;
  onToggleFavorite: () => void;
  onResetProgress: () => void;
}) {
  const totalDuration = capitulos.reduce((sum, c) => sum + (c.duracao_segundos || 0), 0);
  const progress = getBookProgress(book.id);

  return (
    <div className="space-y-6">
      <motion.div variants={item} className="flex gap-5">
        {book.capa_url ? (
          <img src={book.capa_url} alt={book.titulo} className="h-40 w-28 rounded-xl object-cover shadow-lg shrink-0" />
        ) : (
          <div className="flex h-40 w-28 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-lg">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0 py-1">
          <h2 className="text-lg font-bold font-mono leading-snug">{book.titulo}</h2>
          {book.autor && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> {book.autor}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Headphones className="h-3.5 w-3.5" /> {capitulos.length} cap.
            </span>
            {totalDuration > 0 && (
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(totalDuration)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onToggleFavorite}>
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
              {isFavorite ? "Curtido" : "Curtir"}
            </Button>
            {progress > 0 && (
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground" onClick={onResetProgress}>
                <RotateCcw className="h-3.5 w-3.5" /> Resetar
              </Button>
            )}
          </div>
          {progress > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{progress}%</span>
            </div>
          )}
        </div>
      </motion.div>

      {book.descricao && (
        <motion.div variants={item} className="rounded-xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{book.descricao}</p>
        </motion.div>
      )}

      <motion.div variants={item}>
        <h3 className="text-sm font-mono font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Capítulos</h3>
        {capitulos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground font-mono">Nenhum capítulo adicionado ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {capitulos.map((cap, idx) => {
              const { percent, concluido } = getCapProgress(cap.id);
              const isActive = playingCapitulo?.id === cap.id;
              const isCapPlaying = isActive && isPlaying;
              return (
                <motion.div
                  key={cap.id}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onPlayCapitulo(cap)}
                  className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isActive ? "bg-primary/10 border border-primary/30" : "bg-card border border-border hover:border-primary/20"
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isActive ? "bg-primary/20" : "bg-secondary/50 group-hover:bg-primary/10"
                  }`}>
                    {isCapPlaying ? <Pause className="h-4 w-4 text-primary" /> : isActive ? <Play className="h-4 w-4 text-primary ml-0.5" /> : (
                      <span className="text-xs font-mono font-semibold text-muted-foreground">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-mono truncate ${isActive ? "font-semibold text-primary" : "font-medium"}`}>{cap.titulo}</p>
                    {cap.descricao && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{cap.descricao}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {cap.duracao_segundos > 0 && <span className="text-[10px] text-muted-foreground font-mono">{formatTime(cap.duracao_segundos)}</span>}
                      {concluido && <span className="text-[9px] font-mono text-primary">✓</span>}
                      {percent > 0 && !concluido && (
                        <div className="w-16 h-1 rounded-full bg-secondary/50 overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default Audiobooks;
