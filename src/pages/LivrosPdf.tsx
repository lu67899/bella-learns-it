import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, ChevronLeft, Search } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import BackButton from "@/components/BackButton";

interface LivroPdf {
  id: string;
  titulo: string;
  autor: string | null;
  capa_url: string | null;
  pdf_url: string;
  categoria: string | null;
  ordem: number;
}

const LivrosPdf = () => {
  const [livros, setLivros] = useState<LivroPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<LivroPdf | null>(null);
  const [search, setSearch] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("livros_pdf")
        .select("*")
        .order("ordem");
      if (data) setLivros(data as LivroPdf[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const categorias = [...new Set(livros.map((l) => l.categoria).filter(Boolean))] as string[];

  const filtrados = livros.filter((l) => {
    const matchSearch =
      l.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (l.autor || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoriaAtiva || l.categoria === categoriaAtiva;
    return matchSearch && matchCat;
  });

  // Full-screen PDF viewer
  if (selectedBook) {
    return (
      <Layout>
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {/* Viewer header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
            <button
              onClick={() => setSelectedBook(null)}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-mono font-medium truncate">{selectedBook.titulo}</p>
              {selectedBook.autor && (
                <p className="text-[10px] text-muted-foreground truncate">{selectedBook.autor}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedBook(null)}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* PDF iframe */}
          <object
            data={`${selectedBook.pdf_url}#toolbar=0&navpanes=0`}
            type="application/pdf"
            className="flex-1 w-full border-none"
            title={selectedBook.titulo}
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
              <BookOpen className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground font-mono text-center">
                Não foi possível exibir o PDF inline.
              </p>
              <a
                href={selectedBook.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-mono"
              >
                Baixar PDF
              </a>
            </div>
          </object>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <BackButton to="/" />

        <div className="space-y-1">
          <h1 className="text-xl font-mono font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Biblioteca PDF
          </h1>
          <p className="text-xs text-muted-foreground">
            {livros.length} livro{livros.length !== 1 ? "s" : ""} disponível{livros.length !== 1 ? "is" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar livro ou autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card border-border font-mono text-sm"
          />
        </div>

        {/* Category filters */}
        {categorias.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoriaAtiva(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                !categoriaAtiva
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat === categoriaAtiva ? null : cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  categoriaAtiva === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Books grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm text-muted-foreground font-mono">
              {search ? "Nenhum livro encontrado" : "Nenhum livro disponível ainda"}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            {filtrados.map((livro, i) => (
              <motion.button
                key={livro.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedBook(livro)}
                className="group text-left space-y-2"
              >
                {/* Book cover */}
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-border bg-card shadow-sm group-hover:border-primary/40 group-hover:shadow-md transition-all">
                  {livro.capa_url ? (
                    <img
                      src={livro.capa_url}
                      alt={livro.titulo}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-primary/5 gap-2 p-3">
                      <BookOpen className="h-8 w-8 text-primary/30" />
                      <p className="text-[10px] text-primary/40 font-mono text-center leading-tight">
                        {livro.titulo}
                      </p>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-medium shadow-lg">
                      Abrir PDF
                    </span>
                  </div>
                </div>
                {/* Info */}
                <div className="px-0.5">
                  <p className="text-xs font-mono font-medium truncate">{livro.titulo}</p>
                  {livro.autor && (
                    <p className="text-[10px] text-muted-foreground truncate">{livro.autor}</p>
                  )}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default LivrosPdf;
