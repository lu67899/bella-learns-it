import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Anotacao {
  id: string;
  titulo: string;
  conteudo: string;
  tags: string[] | null;
  materia: string | null;
  created_at: string;
}

function ViewAnotacaoContent({ viewing, onEdit, onDelete }: { viewing: Anotacao; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {viewing.materia && <Badge className="bg-primary/20 text-primary border-0 font-mono text-[11px]">{viewing.materia}</Badge>}
        <span className="text-[11px] text-muted-foreground">
          {new Date(viewing.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
      </div>
      <div className="bg-secondary/30 rounded-lg p-4 max-h-60 overflow-y-auto">
        <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed">{viewing.conteudo}</p>
      </div>
      {viewing.tags && viewing.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {viewing.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
        </div>
      )}
      <div className="flex gap-2 border-t border-border pt-3">
        <Button variant="outline" size="sm" className="gap-1.5 flex-1 h-9" onClick={onEdit}>
          <Edit2 className="h-3.5 w-3.5" /> Editar
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 flex-1 h-9 text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </Button>
      </div>
    </div>
  );
}

function ViewAnotacao({ viewing, onClose, onEdit, onDelete }: { viewing: Anotacao | null; onClose: () => void; onEdit: () => void; onDelete: () => void }) {
  const isMobile = useIsMobile();

  if (!viewing) return null;

  if (isMobile) {
    return (
      <Drawer open={!!viewing} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="px-5 pb-6">
          <DrawerHeader className="px-0 pt-4">
            <DrawerTitle className="font-mono text-base">{viewing.titulo}</DrawerTitle>
          </DrawerHeader>
          <ViewAnotacaoContent viewing={viewing} onEdit={onEdit} onDelete={onDelete} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={!!viewing} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-xl">
        <div className="bg-primary/10 px-5 pt-5 pb-3 border-b border-border">
          <DialogHeader>
            <DialogTitle className="font-mono text-lg leading-tight">{viewing.titulo}</DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-5 py-4">
          <ViewAnotacaoContent viewing={viewing} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const Anotacoes = () => {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Anotacao | null>(null);
  const [viewing, setViewing] = useState<Anotacao | null>(null);
  const [form, setForm] = useState({ titulo: "", conteudo: "", materia: "", tags: "" });
  const { toast } = useToast();
  const { user } = useAuth();

  const load = async () => {
    const { data, error } = await supabase.from("anotacoes").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar anotações", variant: "destructive" });
    } else {
      setAnotacoes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.titulo || !form.conteudo) return;
    const payload = {
      titulo: form.titulo,
      conteudo: form.conteudo,
      materia: form.materia || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
    };
    if (editing) {
      await supabase.from("anotacoes").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("anotacoes").insert({ ...payload, user_id: user!.id });
    }
    toast({ title: editing ? "Anotação atualizada!" : "Anotação criada!" });
    setDialogOpen(false);
    setEditing(null);
    setForm({ titulo: "", conteudo: "", materia: "", tags: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("anotacoes").delete().eq("id", id);
    toast({ title: "Anotação removida!" });
    setViewing(null);
    load();
  };

  const openEdit = (a: Anotacao) => {
    setEditing(a);
    setForm({ titulo: a.titulo, conteudo: a.conteudo, materia: a.materia || "", tags: a.tags?.join(", ") || "" });
    setDialogOpen(true);
    setViewing(null);
  };

  const filtradas = anotacoes.filter((a) =>
    a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    a.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
    (a.tags || []).some((t) => t.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton openMenu />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Anotações
            </h1>
            <p className="text-sm text-muted-foreground">Suas notas de estudo</p>
          </div>
          <Button onClick={() => { setEditing(null); setForm({ titulo: "", conteudo: "", materia: "", tags: "" }); setDialogOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nova Anotação
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar anotações..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma anotação encontrada</p>
            <p className="text-xs text-muted-foreground/60">Clique em "Nova Anotação" para começar</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtradas.map((a) => (
              <Card key={a.id} className="bg-card border-border hover:border-neon-green/30 transition-all cursor-pointer group" onClick={() => setViewing(a)}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-mono font-semibold text-sm">{a.titulo}</h3>
                      {a.materia && <p className="text-[10px] text-primary">{a.materia}</p>}
                      <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(a.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{a.conteudo}</p>
                  {a.tags && a.tags.length > 0 && (
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

      {/* View - Drawer on mobile, Dialog on desktop */}
      <ViewAnotacao
        viewing={viewing}
        onClose={() => setViewing(null)}
        onEdit={() => openEdit(viewing!)}
        onDelete={() => remove(viewing!.id)}
      />

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Nova"} Anotação</DialogTitle></DialogHeader>
          <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); save(); }} role="presentation">
            <div className="space-y-4">
              <div role="presentation"><Input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} role="presentation" /></div>
              <div role="presentation"><Input placeholder="Matéria (opcional)" value={form.materia} onChange={(e) => setForm({ ...form, materia: e.target.value })} role="presentation" /></div>
              <div role="presentation"><Textarea placeholder="Conteúdo" rows={6} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} autoComplete="off" role="presentation" /></div>
              <div role="presentation"><Input placeholder="Tags (separadas por vírgula)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} role="presentation" /></div>
              <Button type="submit" className="w-full">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Anotacoes;
