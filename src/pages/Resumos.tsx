import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Search, Loader2, ChevronDown, FileText } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface Resumo {
  id: string;
  materia: string;
  titulo: string;
  conteudo: string;
}

const Resumos = () => {
  const navigate = useNavigate();
  const [resumos, setResumos] = useState<Resumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [openCursos, setOpenCursos] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const fetchResumos = async () => {
      const { data, error } = await supabase.from("resumos").select("*").order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Erro ao carregar resumos", variant: "destructive" });
      } else {
        setResumos(data || []);
      }
      setLoading(false);
    };
    fetchResumos();
  }, []);

  const filtrados = resumos.filter((r) =>
    r.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    r.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
    r.materia.toLowerCase().includes(busca.toLowerCase())
  );

  // Group by materia (curso)
  const grouped = filtrados.reduce<Record<string, Resumo[]>>((acc, r) => {
    if (!acc[r.materia]) acc[r.materia] = [];
    acc[r.materia].push(r);
    return acc;
  }, {});

  const cursoNames = Object.keys(grouped).sort();

  const toggleCurso = (name: string) => {
    setOpenCursos((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Auto-expand all when searching
  const effectiveOpen = busca.trim() ? new Set(cursoNames) : openCursos;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <BackButton openMenu />
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" /> Resumos
            </h1>
            <p className="text-sm text-muted-foreground">Resumos organizados por curso</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar resumos..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : cursoNames.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhum resumo encontrado</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {cursoNames.map((curso) => {
              const isOpen = effectiveOpen.has(curso);
              const items = grouped[curso];
              return (
                <div key={curso} className="rounded-lg border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => toggleCurso(curso)}
                    className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-mono font-semibold text-sm">{curso}</p>
                        <p className="text-xs text-muted-foreground">{items.length} resumo{items.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border"
                    >
                      <div className="p-2 space-y-1">
                        {items.map((r) => (
                          <Link key={r.id} to={`/resumos/${r.id}`}>
                            <div className="group flex items-center gap-3 p-3 rounded-md hover:bg-secondary/40 transition-colors cursor-pointer">
                              <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm truncate group-hover:text-primary transition-colors">{r.titulo}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{r.conteudo.slice(0, 80)}...</p>
                              </div>
                              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Resumos;
