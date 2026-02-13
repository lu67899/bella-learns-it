import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, CircleDot, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface ModuloProgress {
  id: string;
  nome: string;
  descricao: string | null;
  topicos_count: number;
  completed_count: number;
}

const Progresso = () => {
  const [modulos, setModulos] = useState<ModuloProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const [modRes, topRes, progRes] = await Promise.all([
        supabase.from("modulos").select("*").order("ordem"),
        supabase.from("modulo_topicos").select("modulo_id, id"),
        supabase.from("topico_progresso").select("topico_id"),
      ]);

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
          id: m.id,
          nome: m.nome,
          descricao: m.descricao,
          topicos_count: topicIds.length,
          completed_count: topicIds.filter((id) => completedSet.has(id)).length,
        };
      });
      setModulos(mods);

      const totalTopics = Array.from(topicosByModule.values()).flat().length;
      setOverallProgress(totalTopics > 0 ? (completedSet.size / totalTopics) * 100 : 0);
    };
    fetch();
  }, []);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-mono font-bold">Progresso Geral</h1>
            <p className="text-sm text-muted-foreground">Detalhes de conclusão por módulo</p>
          </div>
        </div>

        <Card className="bg-card border-border border-glow">
          <CardContent className="p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-mono">Total concluído</span>
              <span className="font-mono text-primary font-bold">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-4" />
          </CardContent>
        </Card>

        <div className="space-y-3">
          {modulos.map((mod) => {
            const pct = mod.topicos_count > 0 ? (mod.completed_count / mod.topicos_count) * 100 : 0;
            const isComplete = pct === 100;
            return (
              <Link key={mod.id} to={`/modulo/${mod.id}`}>
                <Card className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        ) : (
                          <CircleDot className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <div>
                          <p className={`font-mono font-semibold text-sm ${isComplete ? "text-primary" : ""}`}>{mod.nome}</p>
                          {mod.descricao && <p className="text-[11px] text-muted-foreground">{mod.descricao}</p>}
                        </div>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        {mod.completed_count}/{mod.topicos_count} · {Math.round(pct)}%
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {modulos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum módulo cadastrado.</p>
          )}
        </div>
      </motion.div>
    </Layout>
  );
};

export default Progresso;
