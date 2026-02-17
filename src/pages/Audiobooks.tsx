import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronRight, Clock, User, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface Progresso {
  audiobook_id: string;
  capitulo_id: string | null;
  posicao_segundos: number;
  concluido: boolean;
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
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [capitulos, setCapitulos] = useState<Capitulo[]>([]);
  const [progressos, setProgressos] = useState<Progresso[]>([]);
  const [view, setView] = useState<View>("categories");
  const [selectedCategory, setSelectedCategory] = useState<Categoria | null>(null);
  const [selectedBook, setSelectedBook] = useState<Audiobook | null>(null);
  const [playingCapitulo, setPlayingCapitulo] = useState<Capitulo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const saveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, bookRes, capRes, progRes] = await Promise.all([
        supabase.from("audiobook_categorias").select("*").order("ordem"),
        supabase.from("audiobooks").select("*").order("ordem"),
        supabase.from("audiobook_capitulos").select("*").order("ordem"),
        supabase.from("audiobook_progresso").select("audiobook_id, capitulo_id, posicao_segundos, concluido"),
      ]);
      if (catRes.data) setCategorias(catRes.data);
      if (bookRes.data) setAudiobooks(bookRes.data);
      if (capRes.data) setCapitulos(capRes.data);
      if (progRes.data) setProgressos(progRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const saveProgress = useCallback(async () => {
    if (!playingCapitulo || !audioRef.current || !session?.user?.id) return;
    const pos = Math.floor(audioRef.current.currentTime);
    const concluido = audioRef.current.duration > 0 && pos >= audioRef.current.duration - 5;
    await supabase.from("audiobook_progresso").upsert(
      { user_id: session.user.id, audiobook_id: playingCapitulo.audiobook_id, capitulo_id: playingCapitulo.id, posicao_segundos: pos, concluido },
      { onConflict: "user_id,audiobook_id,capitulo_id" }
    );
    setProgressos((prev) => {
      const idx = prev.findIndex((p) => p.audiobook_id === playingCapitulo.audiobook_id && p.capitulo_id === playingCapitulo.id);
      const newP = { audiobook_id: playingCapitulo.audiobook_id, capitulo_id: playingCapitulo.id, posicao_segundos: pos, concluido };
      if (idx >= 0) return prev.map((p, i) => i === idx ? newP : p);
      return [...prev, newP];
    });
  }, [playingCapitulo, session?.user?.id]);

  const playCapitulo = (cap: Capitulo) => {
    if (playingCapitulo?.id === cap.id) {
      togglePlay();
      return;
    }
    if (playingCapitulo) saveProgress();

    setPlayingCapitulo(cap);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }

    const audio = new Audio(cap.audio_url);
    audio.volume = muted ? 0 : volume;
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      const saved = progressos.find((p) => p.capitulo_id === cap.id);
      if (saved && saved.posicao_segundos > 0 && !saved.concluido) {
        audio.currentTime = saved.posicao_segundos;
        setCurrentTime(saved.posicao_segundos);
      }
      audio.play();
      setIsPlaying(true);
    });

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      saveProgress();
      // Auto-play next chapter
      const bookCaps = capitulos.filter((c) => c.audiobook_id === cap.audiobook_id).sort((a, b) => a.ordem - b.ordem);
      const idx = bookCaps.findIndex((c) => c.id === cap.id);
      if (idx < bookCaps.length - 1) {
        setTimeout(() => playCapitulo(bookCaps[idx + 1]), 1000);
      }
    });
  };

  useEffect(() => {
    if (isPlaying) {
      saveInterval.current = setInterval(saveProgress, 15000);
    }
    return () => { if (saveInterval.current) clearInterval(saveInterval.current); };
  }, [isPlaying, saveProgress]);

  useEffect(() => {
    return () => {
      saveProgress();
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); saveProgress(); } else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const seek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + seconds));
  };

  const handleVolume = (value: number[]) => {
    const v = value[0];
    setVolume(v);
    setMuted(v === 0);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.volume = muted ? volume || 0.5 : 0;
    setMuted(!muted);
  };

  const getCapProgress = (capId: string) => {
    const p = progressos.find((pr) => pr.capitulo_id === capId);
    if (!p) return { percent: 0, concluido: false };
    const cap = capitulos.find((c) => c.id === capId);
    if (!cap || !cap.duracao_segundos) return { percent: 0, concluido: p.concluido };
    return { percent: Math.min(100, (p.posicao_segundos / cap.duracao_segundos) * 100), concluido: p.concluido };
  };

  const getBookTotalDuration = (bookId: string) => {
    const caps = capitulos.filter((c) => c.audiobook_id === bookId);
    return caps.reduce((sum, c) => sum + (c.duracao_segundos || 0), 0);
  };

  const getBookProgress = (bookId: string) => {
    const caps = capitulos.filter((c) => c.audiobook_id === bookId);
    if (caps.length === 0) return 0;
    const completed = caps.filter((c) => progressos.find((p) => p.capitulo_id === c.id)?.concluido).length;
    return Math.round((completed / caps.length) * 100);
  };

  const handleBack = () => {
    if (view === "detail") setView("books");
    else if (view === "books") { setView("categories"); setSelectedCategory(null); }
    else navigate("/");
  };

  const selectCategory = (cat: Categoria) => {
    setSelectedCategory(cat);
    setView("books");
  };

  const selectBook = (book: Audiobook) => {
    setSelectedBook(book);
    setView("detail");
  };

  const booksInCategory = selectedCategory
    ? selectedCategory.id === "__uncategorized__"
      ? audiobooks.filter((b) => !b.categoria_id)
      : audiobooks.filter((b) => b.categoria_id === selectedCategory.id)
    : [];

  const bookCapitulos = selectedBook
    ? capitulos.filter((c) => c.audiobook_id === selectedBook.id).sort((a, b) => a.ordem - b.ordem)
    : [];

  const uncategorized = audiobooks.filter((b) => !b.categoria_id);

  const backLabel = view === "detail" ? selectedCategory?.nome || "Voltar" : view === "books" ? "Categorias" : "Voltar";

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-6 pb-32">
        {/* Header */}
        <motion.div variants={item}>
          <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Button>

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
            onSelect={selectCategory}
          />
        ) : view === "books" ? (
          <BooksListView
            books={booksInCategory}
            capitulos={capitulos}
            getBookTotalDuration={getBookTotalDuration}
            getBookProgress={getBookProgress}
            onSelect={selectBook}
          />
        ) : view === "detail" && selectedBook ? (
          <BookDetailView
            book={selectedBook}
            capitulos={bookCapitulos}
            playingCapitulo={playingCapitulo}
            isPlaying={isPlaying}
            getCapProgress={getCapProgress}
            onPlayCapitulo={playCapitulo}
          />
        ) : null}
      </motion.div>

      {/* Player fixo */}
      <AnimatePresence>
        {playingCapitulo && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl"
          >
            <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Headphones className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-medium truncate">{playingCapitulo.titulo}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {audiobooks.find((b) => b.id === playingCapitulo.audiobook_id)?.titulo}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skip(-15)}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-primary/10 hover:bg-primary/20" onClick={togglePlay}>
                    {isPlaying ? <Pause className="h-5 w-5 text-primary" /> : <Play className="h-5 w-5 text-primary ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skip(30)}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                    {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground w-12 text-right">{formatTime(currentTime)}</span>
                <Slider value={[currentTime]} max={duration || 1} step={1} onValueChange={seek} className="flex-1" />
                <span className="text-[10px] font-mono text-muted-foreground w-12">{formatTime(duration)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

// ── Categories Grid ──
function CategoriesView({ categorias, audiobooks, uncategorized, onSelect }: {
  categorias: Categoria[];
  audiobooks: Audiobook[];
  uncategorized: Audiobook[];
  onSelect: (cat: Categoria) => void;
}) {
  if (categorias.length === 0 && uncategorized.length === 0) {
    return (
      <motion.div variants={item} className="text-center py-12">
        <Headphones className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground font-mono">Nenhum audiobook disponível ainda</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
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

// ── Books List (inside category) ──
function BooksListView({ books, capitulos, getBookTotalDuration, getBookProgress, onSelect }: {
  books: Audiobook[];
  capitulos: Capitulo[];
  getBookTotalDuration: (id: string) => number;
  getBookProgress: (id: string) => number;
  onSelect: (book: Audiobook) => void;
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
        return (
          <motion.div
            key={book.id}
            variants={item}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(book)}
            className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border cursor-pointer transition-all hover:border-primary/30 hover:shadow-md"
          >
            {book.capa_url ? (
              <img src={book.capa_url} alt={book.titulo} className="h-20 w-16 rounded-lg object-cover shrink-0 shadow-sm" />
            ) : (
              <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-semibold truncate">{book.titulo}</p>
              {book.autor && (
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <User className="h-3 w-3" /> {book.autor}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {chapCount > 0 && (
                  <span className="text-[10px] text-muted-foreground font-mono">{chapCount} capítulo{chapCount !== 1 ? "s" : ""}</span>
                )}
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
                  {progress === 100 && <span className="text-[9px] font-mono text-primary">✓ Concluído</span>}
                </div>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Book Detail View ──
function BookDetailView({ book, capitulos, playingCapitulo, isPlaying, getCapProgress, onPlayCapitulo }: {
  book: Audiobook;
  capitulos: Capitulo[];
  playingCapitulo: Capitulo | null;
  isPlaying: boolean;
  getCapProgress: (id: string) => { percent: number; concluido: boolean };
  onPlayCapitulo: (cap: Capitulo) => void;
}) {
  const totalDuration = capitulos.reduce((sum, c) => sum + (c.duracao_segundos || 0), 0);

  return (
    <div className="space-y-6">
      {/* Book Hero */}
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
              <Headphones className="h-3.5 w-3.5" /> {capitulos.length} capítulo{capitulos.length !== 1 ? "s" : ""}
            </span>
            {totalDuration > 0 && (
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(totalDuration)}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Description */}
      {book.descricao && (
        <motion.div variants={item} className="rounded-xl bg-card border border-border p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{book.descricao}</p>
        </motion.div>
      )}

      {/* Chapters List */}
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
                  {/* Chapter Number / Play Icon */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                    isActive ? "bg-primary/20" : "bg-secondary/50 group-hover:bg-primary/10"
                  }`}>
                    {isCapPlaying ? (
                      <Pause className="h-4 w-4 text-primary" />
                    ) : isActive ? (
                      <Play className="h-4 w-4 text-primary ml-0.5" />
                    ) : (
                      <span className="text-xs font-mono font-semibold text-muted-foreground">{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-mono truncate ${isActive ? "font-semibold text-primary" : "font-medium"}`}>
                      {cap.titulo}
                    </p>
                    {cap.descricao && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{cap.descricao}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {cap.duracao_segundos > 0 && (
                        <span className="text-[10px] text-muted-foreground font-mono">{formatTime(cap.duracao_segundos)}</span>
                      )}
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
