import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Plus, Check, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { materias } from "@/data/resumos";

interface Tarefa {
  id: string;
  materia: string;
  titulo: string;
  dia: string;
  horario: string;
  concluida: boolean;
}

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const Cronograma = () => {
  const [tarefas, setTarefas] = useLocalStorage<Tarefa[]>("bella-cronograma", []);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [form, setForm] = useState({ materia: "", titulo: "", dia: "", horario: "" });

  const salvar = () => {
    if (!form.materia || !form.titulo || !form.dia) return;
    setTarefas((prev) => [...prev, { id: `t-${Date.now()}`, ...form, concluida: false }]);
    setForm({ materia: "", titulo: "", dia: "", horario: "" });
    setDialogAberto(false);
  };

  const toggleConcluida = (id: string) => {
    setTarefas((prev) => prev.map((t) => (t.id === id ? { ...t, concluida: !t.concluida } : t)));
  };

  const excluir = (id: string) => {
    setTarefas((prev) => prev.filter((t) => t.id !== id));
  };

  const total = tarefas.length;
  const concluidas = tarefas.filter((t) => t.concluida).length;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-neon-pink" /> Cronograma
            </h1>
            <p className="text-sm text-muted-foreground">Planeje sua semana de estudos</p>
          </div>
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Tarefa</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-mono">Nova Tarefa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Select value={form.dia} onValueChange={(v) => setForm({ ...form, dia: v })}>
                  <SelectTrigger><SelectValue placeholder="Dia da semana" /></SelectTrigger>
                  <SelectContent>{diasSemana.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.materia} onValueChange={(v) => setForm({ ...form, materia: v })}>
                  <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
                  <SelectContent>{materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="O que estudar?" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                <Input placeholder="Horário (ex: 14:00 - 16:00)" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
                <Button onClick={salvar} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress */}
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

        {/* Grid por dia */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {diasSemana.map((dia) => {
            const tarefasDia = tarefas.filter((t) => t.dia === dia);
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
                          <button onClick={() => excluir(t.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
