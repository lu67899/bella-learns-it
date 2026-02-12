import { useState } from "react";
import { motion } from "framer-motion";
import { StickyNote, Plus, Trash2, Edit2, Search } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface Anotacao {
  id: string;
  titulo: string;
  conteudo: string;
  tags: string[];
  criadaEm: string;
}

const Anotacoes = () => {
  const [anotacoes, setAnotacoes] = useLocalStorage<Anotacao[]>("bella-anotacoes", []);
  const [busca, setBusca] = useState("");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Anotacao | null>(null);
  const [form, setForm] = useState({ titulo: "", conteudo: "", tags: "" });

  const filtradas = anotacoes.filter((a) =>
    a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    a.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
    a.tags.some((t) => t.toLowerCase().includes(busca.toLowerCase()))
  );

  const salvar = () => {
    if (!form.titulo || !form.conteudo) return;
    const nova: Anotacao = {
      id: editando ? editando.id : `a-${Date.now()}`,
      titulo: form.titulo,
      conteudo: form.conteudo,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      criadaEm: editando ? editando.criadaEm : new Date().toLocaleDateString("pt-BR"),
    };
    if (editando) {
      setAnotacoes((prev) => prev.map((a) => (a.id === editando.id ? nova : a)));
    } else {
      setAnotacoes((prev) => [nova, ...prev]);
    }
    setForm({ titulo: "", conteudo: "", tags: "" });
    setEditando(null);
    setDialogAberto(false);
  };

  const editar = (a: Anotacao) => {
    setEditando(a);
    setForm({ titulo: a.titulo, conteudo: a.conteudo, tags: a.tags.join(", ") });
    setDialogAberto(true);
  };

  const excluir = (id: string) => {
    setAnotacoes((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <StickyNote className="h-6 w-6 text-neon-green" /> Anotações
            </h1>
            <p className="text-sm text-muted-foreground">Suas notas pessoais</p>
          </div>
          <Dialog open={dialogAberto} onOpenChange={(o) => { setDialogAberto(o); if (!o) { setEditando(null); setForm({ titulo: "", conteudo: "", tags: "" }); } }}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Anotação</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-mono">{editando ? "Editar" : "Nova"} Anotação</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                <Textarea placeholder="Escreva sua anotação..." rows={8} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} />
                <Input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                <Button onClick={salvar} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar anotações..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        {filtradas.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma anotação ainda</p>
            <p className="text-xs text-muted-foreground/60">Clique em "Nova Anotação" para começar</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtradas.map((a) => (
              <Card key={a.id} className="bg-card border-border hover:border-neon-green/30 transition-all group">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-mono font-semibold text-sm">{a.titulo}</h3>
                      <p className="text-[10px] text-muted-foreground">{a.criadaEm}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editar(a)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => excluir(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{a.conteudo}</p>
                  {a.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {a.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Anotacoes;
