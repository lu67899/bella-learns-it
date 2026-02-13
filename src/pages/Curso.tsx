import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface CursoDB {
  id: string;
  nome: string;
  descricao: string | null;
}

interface ModuloDB {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  topicos_count: number;
  completed_count: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const CursoPage = () => {
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<CursoDB | null>(null);
  const [modulos, setModulos] = useState<ModuloDB[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [cursoRes, modRes, topRes, progRes] = await Promise.all([
        supabase.from("cursos").select("*").eq("id", id!).single(),
        supabase.from("modulos").select("*").eq("curso_id", id!).order("ordem"),
        supabase.from("modulo_topicos").select("modulo_id, id"),
        supabase.from("topico_progresso").select("topico_id"),
      ]);

      if (cursoRes.data) setCurso(cursoRes.data);

      const topicosByModule = new Map<string, string[]>();
      (topRes.data || []).forEach((t: any) => {
        const arr = topicosByModule.get(t.modulo_id) || [];
        arr.push(t.id);
        topicosByModule.set(t.modulo_id, arr);
      });

      const completedSet = new Set((progRes.data || []).map((p: any) => p.topico_id));

      const mods = (modRes.data || []).map((m: any) => {
        const topicIds = topicosByModule.get(m.id) || [];
        return {
          ...m,
          topicos_count: topicIds.length,
          completed_count: topicIds.filter((tid: string) => completedSet.has(tid)).length,
        };
      });
      setModulos(mods);
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!curso) {
    return (
      <Layout>
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">Curso não encontrado</p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-6">
        <motion.div variants={item} className="space-y-2">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> {curso.nome}
          </h1>
          {curso.descricao && <p className="text-sm text-muted-foreground">{curso.descricao}</p>}
        </motion.div>

        <motion.div variants={item} className="space-y-3">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Módulos</p>
          {modulos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum módulo neste curso.</p>
          ) : (
            <div className="space-y-2">
              {modulos.map((mod, i) => {
                const pct = mod.topicos_count > 0 ? (mod.completed_count / mod.topicos_count) * 100 : 0;
                return (
                  <Link key={mod.id} to={`/modulo/${mod.id}`}>
                    <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-all cursor-pointer">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-mono font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        {pct === 100 ? <CheckCircle2 className="h-4 w-4 text-primary" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">{mod.nome}</p>
                        {mod.descricao && <p className="text-xs text-muted-foreground truncate">{mod.descricao}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={pct} className="h-1 flex-1" />
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">{Math.round(pct)}%</span>
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default CursoPage;
