import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Check, Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tarefa | null>(null);
  const [form, setForm] = useState({ titulo: "", materia: "", dia_semana: "0", horario: "" });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTarefas = async () => {
    const { data, error } = await supabase.from("cronograma").select("*").order("dia_semana").order("horario");
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

  const save = async () => {
    if (!form.titulo || !form.materia || !form.horario) return;
    const payload = { titulo: form.titulo, materia: form.materia, dia_semana: parseInt(form.dia_semana), horario: form.horario };
    if (editing) {
      await supabase.from("cronograma").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("cronograma").insert({ ...payload, user_id: user!.id });
    }
    toast({ title: editing ? "Tarefa atualizada!" : "Tarefa adicionada!" });
    setDialogOpen(false);
    setEditing(null);
    setForm({ titulo: "", materia: "", dia_semana: "0", horario: "" });
    fetchTarefas();
  };

  const remove = async (id: string) => {
    await supabase.from("cronograma").delete().eq("id", id);
    toast({ title: "Tarefa removida!" });
    fetchTarefas();
  };

  const openEdit = (tarefa: Tarefa) => {
    setEditing(tarefa);
    setForm({ titulo: tarefa.titulo, materia: tarefa.materia, dia_semana: String(tarefa.dia_semana), horario: tarefa.horario });
    setDialogOpen(true);
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
        <div className="mb-5">
          <BackButton to="/" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-neon-pink" /> Cronograma
            </h1>
            <p className="text-sm text-muted-foreground">Seu planejamento semanal de estudos</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm({ titulo: "", materia: "", dia_semana: "0", horario: "" }); setDialogOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Tarefa
          </Button>
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
                        <div key={t.id} className={`flex items-start gap-2 p-2.5 rounded-lg border transition-all group ${t.concluida ? "border-neon-green/20 bg-neon-green/5" : "border-border"}`}>
                          <button onClick={() => toggleConcluida(t.id)} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${t.concluida ? "bg-neon-green border-neon-green text-background" : "border-muted-foreground/30 hover:border-primary"}`}>
                            {t.concluida && <Check className="h-3 w-3" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${t.concluida ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</p>
                            <p className="text-[10px] text-muted-foreground">{t.materia}</p>
                            {t.horario && <p className="text-[10px] text-primary font-mono">{t.horario}</p>}
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(t)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(t.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[340px] p-0 overflow-hidden rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/5">
          <div className="px-5 pt-5 pb-3">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm tracking-tight">{editing ? "Editar" : "Nova"} Tarefa</DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-5 pb-5 space-y-3">
            <Input placeholder="Título da tarefa" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="h-9 text-sm bg-secondary/30 border-border/50 focus-visible:ring-primary/30" />
            <Input placeholder="Matéria" value={form.materia} onChange={(e) => setForm({ ...form, materia: e.target.value })} className="h-9 text-sm bg-secondary/30 border-border/50 focus-visible:ring-primary/30" />
            <Select value={form.dia_semana} onValueChange={(v) => setForm({ ...form, dia_semana: v })}>
              <SelectTrigger className="h-9 text-sm bg-secondary/30 border-border/50"><SelectValue placeholder="Dia da semana" /></SelectTrigger>
              <SelectContent>{diasSemana.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Horário (ex: 08:00)" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} className="h-9 text-sm bg-secondary/30 border-border/50 focus-visible:ring-primary/30" />
            <Button onClick={save} className="w-full h-9 text-sm font-medium rounded-xl mt-1">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Cronograma;
