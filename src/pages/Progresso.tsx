import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, CircleDot, BookOpen, ChevronDown } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ModuloProgress {
  id: string;
  nome: string;
  descricao: string | null;
  topicos_count: number;
  completed_count: number;
  curso_id: string | null;
}

interface CursoGroup {
  id: string;
  nome: string;
  modulos: ModuloProgress[];
  totalTopics: number;
  completedTopics: number;
}

const Progresso = () => {
  const { user } = useAuth();
  const [cursoGroups, setCursoGroups] = useState<CursoGroup[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [openCursos, setOpenCursos] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      // Fetch enrolled course IDs first
      let enrolledCursoIds: string[] = [];
      if (user) {
        const { data: inscData } = await supabase
          .from("inscricoes_cursos")
          .select("curso_id")
          .eq("user_id", user.id);
        enrolledCursoIds = (inscData || []).map((i: any) => i.curso_id);
      }

      if (enrolledCursoIds.length === 0) {
        setCursoGroups([]);
        setOverallProgress(0);
        return;
      }

      const [cursoRes, modRes, topRes, progRes] = await Promise.all([
        supabase.from("cursos").select("id, nome, ordem").in("id", enrolledCursoIds).order("ordem"),
        supabase.from("modulos").select("*").in("curso_id", enrolledCursoIds).order("ordem"),
        supabase.from("modulo_topicos").select("modulo_id, id"),
        supabase.from("topico_progresso").select("topico_id"),
      ]);

      const moduleIds = (modRes.data || []).map((m: any) => m.id);

      const topicosByModule = new Map<string, string[]>();
      (topRes.data || []).forEach((t: any) => {
        if (moduleIds.includes(t.modulo_id)) {
          const arr = topicosByModule.get(t.modulo_id) || [];
          arr.push(t.id);
          topicosByModule.set(t.modulo_id, arr);
        }
      });

      const completedSet = new Set((progRes.data || []).map((p: any) => p.topico_id));

      const modsWithProgress: ModuloProgress[] = (modRes.data || []).map((m: any) => {
        const topicIds = topicosByModule.get(m.id) || [];
        return {
          id: m.id,
          nome: m.nome,
          descricao: m.descricao,
          curso_id: m.curso_id,
          topicos_count: topicIds.length,
          completed_count: topicIds.filter((id: string) => completedSet.has(id)).length,
        };
      });

      const cursoMap = new Map<string, CursoGroup>();
      (cursoRes.data || []).forEach((c: any) => {
        cursoMap.set(c.id, { id: c.id, nome: c.nome, modulos: [], totalTopics: 0, completedTopics: 0 });
      });

      modsWithProgress.forEach((mod) => {
        const group = mod.curso_id ? cursoMap.get(mod.curso_id) : null;
        if (group) {
          group.modulos.push(mod);
          group.totalTopics += mod.topicos_count;
          group.completedTopics += mod.completed_count;
        }
      });

      const groups = [...cursoMap.values()];
      setCursoGroups(groups);

      const totalT = groups.reduce((s, g) => s + g.totalTopics, 0);
      const totalC = groups.reduce((s, g) => s + g.completedTopics, 0);
      setOverallProgress(totalT > 0 ? (totalC / totalT) * 100 : 0);
    };
    fetchData();
  }, [user]);

  const toggleCurso = (id: string) => {
    setOpenCursos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-5">
          <BackButton to="/" />
          <div>
            <h1 className="text-2xl font-mono font-bold">Progresso Geral</h1>
            <p className="text-sm text-muted-foreground">Acompanhe sua evolução por curso</p>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-mono">Total concluído</span>
              <span className="font-mono text-primary font-bold">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-4" />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {cursoGroups.map((grupo) => {
            const cursoPct = grupo.totalTopics > 0 ? (grupo.completedTopics / grupo.totalTopics) * 100 : 0;
            const isOpen = openCursos.has(grupo.id);
            const isCursoComplete = cursoPct === 100 && grupo.totalTopics > 0;

            return (
              <div key={grupo.id}>
                <button onClick={() => toggleCurso(grupo.id)} className="w-full text-left">
                  <Card className={`bg-card border-border transition-all ${isOpen ? "border-primary/30" : "hover:border-primary/20"}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isCursoComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                          )}
                          <div>
                            <p className={`font-mono font-semibold text-sm ${isCursoComplete ? "text-primary" : ""}`}>{grupo.nome}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {grupo.modulos.length} módulo{grupo.modulos.length !== 1 ? "s" : ""} · {grupo.completedTopics}/{grupo.totalTopics} tópicos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground">{Math.round(cursoPct)}%</span>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                      <Progress value={cursoPct} className="h-2" />
                    </CardContent>
                  </Card>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-2 space-y-1.5 border-l-2 border-border pl-4">
                        {grupo.modulos.map((mod) => {
                          const pct = mod.topicos_count > 0 ? (mod.completed_count / mod.topicos_count) * 100 : 0;
                          const isComplete = pct === 100 && mod.topicos_count > 0;
                          return (
                            <Link key={mod.id} to={`/modulo/${mod.id}`}>
                              <div className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/30 transition-all cursor-pointer">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary">
                                  {isComplete ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                  ) : (
                                    <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-mono text-xs truncate ${isComplete ? "text-primary" : ""}`}>{mod.nome}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Progress value={pct} className="h-1 flex-1" />
                                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                      {mod.completed_count}/{mod.topicos_count}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          {cursoGroups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Você ainda não está inscrito em nenhum curso.</p>
          )}
        </div>
      </motion.div>
    </Layout>
  );
};

export default Progresso;
