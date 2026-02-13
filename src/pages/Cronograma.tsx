import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Check, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Tarefa {
  id: string;
  materia: string;
  titulo: string;
  dia_semana: number;
  horario: string;
  concluida: boolean;
}

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const Cronograma = () => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTarefas = async () => {
    const { data, error } = await supabase.from("cronograma").select("*").order("created_at");
    if (error) {
      toast({ title: "Erro ao carregar cronograma", variant: "destructive" });
    } else {
      setTarefas(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTarefas(); }, []);

  const toggleConcluida = async (id: string) => {
    const tarefa = tarefas.find((t) => t.id === id);
    if (!tarefa) return;
    const { error } = await supabase.from("cronograma").update({ concluida: !tarefa.concluida }).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, concluida: !t.concluida } : t)));
    }
  };

  const total = tarefas.length;
  const concluidas = tarefas.filter((t) => t.concluida).length;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-neon-pink" /> Cronograma
          </h1>
          <p className="text-sm text-muted-foreground">Seu planejamento semanal de estudos</p>
        </div>

        {total > 0 && (
          <Card className="bg-card border-glow">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso semanal</span>
                <span className="font-mono text-primary">{concluidas}/{total}</span>
              </div>
              <Progress value={(concluidas / total) * 100} className="h-2" />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {diasSemana.map((dia, idx) => {
            const tarefasDia = tarefas.filter((t) => t.dia_semana === idx);
            return (
              <motion.div key={dia} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-card border-border h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-mono flex items-center justify-between">
                      {dia}
                      <Badge variant="secondary" className="text-[10px]">{tarefasDia.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tarefasDia.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50 text-center py-4">Sem tarefas</p>
                    ) : (
                      tarefasDia.map((t) => (
                        <div key={t.id} className={`flex items-start gap-2 p-2.5 rounded-lg border transition-all ${t.concluida ? "border-neon-green/20 bg-neon-green/5" : "border-border"}`}>
                          <button onClick={() => toggleConcluida(t.id)} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${t.concluida ? "bg-neon-green border-neon-green text-background" : "border-muted-foreground/30 hover:border-primary"}`}>
                            {t.concluida && <Check className="h-3 w-3" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${t.concluida ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</p>
                            <p className="text-[10px] text-muted-foreground">{t.materia}</p>
                            {t.horario && <p className="text-[10px] text-primary font-mono">{t.horario}</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default Cronograma;
