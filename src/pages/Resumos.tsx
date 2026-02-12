import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Search, X, Edit2, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { resumosIniciais, materias, type Resumo } from "@/data/resumos";

const Resumos = () => {
  const [resumos, setResumos] = useLocalStorage<Resumo[]>("bella-resumos", resumosIniciais);
  const [busca, setBusca] = useState("");
  const [materiaFiltro, setMateriaFiltro] = useState<string>("todas");
  const [resumoAberto, setResumoAberto] = useState<Resumo | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Resumo | null>(null);
  const [form, setForm] = useState({ materia: "", titulo: "", conteudo: "", tags: "" });

  const filtrados = resumos.filter((r) => {
    const matchBusca = r.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      r.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(busca.toLowerCase()));
    const matchMateria = materiaFiltro === "todas" || r.materia === materiaFiltro;
    return matchBusca && matchMateria;
  });

  const salvar = () => {
    if (!form.materia || !form.titulo || !form.conteudo) return;
    const novo: Resumo = {
      id: editando ? editando.id : `r-${Date.now()}`,
      materia: form.materia,
      titulo: form.titulo,
      conteudo: form.conteudo,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      isCustom: true,
    };
    if (editando) {
      setResumos((prev) => prev.map((r) => (r.id === editando.id ? novo : r)));
    } else {
      setResumos((prev) => [...prev, novo]);
    }
    setForm({ materia: "", titulo: "", conteudo: "", tags: "" });
    setEditando(null);
    setDialogAberto(false);
  };

  const excluir = (id: string) => {
    setResumos((prev) => prev.filter((r) => r.id !== id));
    setResumoAberto(null);
  };

  const editar = (r: Resumo) => {
    setEditando(r);
    setForm({ materia: r.materia, titulo: r.titulo, conteudo: r.conteudo, tags: r.tags.join(", ") });
    setDialogAberto(true);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" /> Resumos
            </h1>
            <p className="text-sm text-muted-foreground">Matérias do curso de SI</p>
          </div>
          <Dialog open={dialogAberto} onOpenChange={(o) => { setDialogAberto(o); if (!o) { setEditando(null); setForm({ materia: "", titulo: "", conteudo: "", tags: "" }); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Resumo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle className="font-mono">{editando ? "Editar" : "Novo"} Resumo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Select value={form.materia} onValueChange={(v) => setForm({ ...form, materia: v })}>
                  <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
                  <SelectContent>{materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                <Textarea placeholder="Conteúdo (suporta **negrito**)" rows={8} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} />
                <Input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                <Button onClick={salvar} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por tema..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
          <Select value={materiaFiltro} onValueChange={setMateriaFiltro}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as matérias</SelectItem>
              {materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Lista / Detalhe */}
        {resumoAberto ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button variant="ghost" onClick={() => setResumoAberto(null)} className="mb-4 gap-2"><X className="h-4 w-4" /> Voltar</Button>
            <Card className="bg-card border-glow">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 text-primary border-primary/30">{resumoAberto.materia}</Badge>
                  <CardTitle className="font-mono text-xl">{resumoAberto.titulo}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => editar(resumoAberto)}><Edit2 className="h-4 w-4" /></Button>
                  {resumoAberto.isCustom && <Button variant="ghost" size="icon" onClick={() => excluir(resumoAberto.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {resumoAberto.conteudo}
                </div>
                <div className="flex gap-2 mt-6 flex-wrap">
                  {resumoAberto.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtrados.map((r) => (
              <Card key={r.id} className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group" onClick={() => setResumoAberto(r)}>
                <CardContent className="p-5">
                  <Badge variant="outline" className="mb-2 text-xs text-primary border-primary/30">{r.materia}</Badge>
                  <h3 className="font-mono font-semibold mb-2 group-hover:text-primary transition-colors">{r.titulo}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{r.conteudo.slice(0, 120)}...</p>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {r.tags.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Resumos;
