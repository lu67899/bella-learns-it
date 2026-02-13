import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, BookOpen, BrainCircuit, Plus, Edit2, Trash2, LogOut, Lock, MessageCircle, Send, GraduationCap, ArrowUp, ArrowDown } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { materias } from "@/data/resumos";

const ADMIN_PASSWORD = "bella2024";

// Types
interface Resumo { id: string; materia: string; titulo: string; conteudo: string; created_at: string; }
interface Flashcard { id: string; materia: string; pergunta: string; resposta: string; created_at: string; }
interface QuizQuestion { id: string; materia: string; pergunta: string; opcoes: string[]; correta: number; created_at: string; }
interface CronogramaItem { id: string; titulo: string; materia: string; dia_semana: number; horario: string; concluida: boolean; created_at: string; }
interface Anotacao { id: string; titulo: string; conteudo: string; materia: string | null; tags: string[] | null; created_at: string; }

const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const Admin = () => {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");

  const handleLogin = () => {
    if (senha === ADMIN_PASSWORD) {
      setAutenticado(true);
      toast.success("Acesso concedido!");
    } else {
      toast.error("Senha incorreta!");
    }
  };

  if (!autenticado) {
    return (
      <Layout>
        <div className="max-w-sm mx-auto mt-20 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/20 glow-purple">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-mono font-bold">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Digite a senha para acessar</p>
          </motion.div>
          <Card className="bg-card border-glow">
            <CardContent className="p-6 space-y-4">
              <Input
                type="password"
                placeholder="Senha de acesso"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <Button onClick={handleLogin} className="w-full gap-2">
                <Shield className="h-4 w-4" /> Entrar
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" /> Painel Admin
            </h1>
            <p className="text-sm text-muted-foreground">Gerencie todo o conteúdo do app</p>
          </div>
          <Button variant="ghost" onClick={() => setAutenticado(false)} className="gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>

        <Tabs defaultValue="modulos">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="modulos" className="gap-1 text-xs"><GraduationCap className="h-3 w-3" /> Módulos</TabsTrigger>
            <TabsTrigger value="resumos" className="gap-1 text-xs"><BookOpen className="h-3 w-3" /> Resumos</TabsTrigger>
            <TabsTrigger value="flashcards" className="gap-1 text-xs"><BrainCircuit className="h-3 w-3" /> Flashcards</TabsTrigger>
            <TabsTrigger value="quiz" className="gap-1 text-xs"><BrainCircuit className="h-3 w-3" /> Quiz</TabsTrigger>
            <TabsTrigger value="mensagens" className="gap-1 text-xs"><MessageCircle className="h-3 w-3" /> Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="modulos"><ModulosTab /></TabsContent>
          <TabsContent value="resumos"><ResumosTab /></TabsContent>
          <TabsContent value="flashcards"><FlashcardsTab /></TabsContent>
          <TabsContent value="quiz"><QuizTab /></TabsContent>
          <TabsContent value="mensagens"><MensagensTab /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// ─── RESUMOS TAB ─────────────────────────────────────────
function ResumosTab() {
  const [items, setItems] = useState<Resumo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resumo | null>(null);
  const [form, setForm] = useState({ materia: "", titulo: "", conteudo: "" });

  const load = async () => {
    const { data } = await supabase.from("resumos").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.materia || !form.titulo || !form.conteudo) return;
    if (editing) {
      await supabase.from("resumos").update(form).eq("id", editing.id);
    } else {
      await supabase.from("resumos").insert(form);
    }
    toast.success("Resumo salvo!");
    setDialogOpen(false); setEditing(null); setForm({ materia: "", titulo: "", conteudo: "" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("resumos").delete().eq("id", id);
    toast.success("Removido!"); load();
  };

  const edit = (item: Resumo) => {
    setEditing(item); setForm({ materia: item.materia, titulo: item.titulo, conteudo: item.conteudo }); setDialogOpen(true);
  };

  return (
    <CrudSection
      title="Resumos"
      count={items.length}
      onAdd={() => { setEditing(null); setForm({ materia: "", titulo: "", conteudo: "" }); setDialogOpen(true); }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Matéria</TableHead>
            <TableHead>Título</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell><Badge variant="outline" className="text-primary border-primary/30">{item.materia}</Badge></TableCell>
              <TableCell className="font-mono text-sm">{item.titulo}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => edit(item)}><Edit2 className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Novo"} Resumo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={form.materia} onValueChange={(v) => setForm({ ...form, materia: v })}>
              <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
              <SelectContent>{materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <Textarea placeholder="Conteúdo" rows={6} value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} />
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}

// ─── FLASHCARDS TAB ──────────────────────────────────────
function FlashcardsTab() {
  const [items, setItems] = useState<Flashcard[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [form, setForm] = useState({ materia: "", pergunta: "", resposta: "" });

  const load = async () => {
    const { data } = await supabase.from("flashcards").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.materia || !form.pergunta || !form.resposta) return;
    if (editing) {
      await supabase.from("flashcards").update(form).eq("id", editing.id);
    } else {
      await supabase.from("flashcards").insert(form);
    }
    toast.success("Flashcard salvo!"); setDialogOpen(false); setEditing(null); setForm({ materia: "", pergunta: "", resposta: "" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("flashcards").delete().eq("id", id);
    toast.success("Removido!"); load();
  };

  const edit = (item: Flashcard) => {
    setEditing(item); setForm({ materia: item.materia, pergunta: item.pergunta, resposta: item.resposta }); setDialogOpen(true);
  };

  return (
    <CrudSection title="Flashcards" count={items.length} onAdd={() => { setEditing(null); setForm({ materia: "", pergunta: "", resposta: "" }); setDialogOpen(true); }}>
      <Table>
        <TableHeader><TableRow><TableHead>Matéria</TableHead><TableHead>Pergunta</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell><Badge variant="outline" className="text-primary border-primary/30">{item.materia}</Badge></TableCell>
              <TableCell className="font-mono text-sm">{item.pergunta}</TableCell>
              <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => edit(item)}><Edit2 className="h-3 w-3" /></Button><Button variant="ghost" size="icon" onClick={() => remove(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Novo"} Flashcard</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={form.materia} onValueChange={(v) => setForm({ ...form, materia: v })}>
              <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
              <SelectContent>{materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Pergunta" value={form.pergunta} onChange={(e) => setForm({ ...form, pergunta: e.target.value })} />
            <Textarea placeholder="Resposta" rows={4} value={form.resposta} onChange={(e) => setForm({ ...form, resposta: e.target.value })} />
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}

// ─── QUIZ TAB ────────────────────────────────────────────
function QuizTab() {
  const [items, setItems] = useState<QuizQuestion[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QuizQuestion | null>(null);
  const [form, setForm] = useState({ materia: "", pergunta: "", opcao1: "", opcao2: "", opcao3: "", opcao4: "", correta: "0" });

  const load = async () => {
    const { data } = await supabase.from("quiz_questions").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.materia || !form.pergunta || !form.opcao1 || !form.opcao2 || !form.opcao3 || !form.opcao4) return;
    const payload = {
      materia: form.materia,
      pergunta: form.pergunta,
      opcoes: [form.opcao1, form.opcao2, form.opcao3, form.opcao4],
      correta: parseInt(form.correta),
    };
    if (editing) {
      await supabase.from("quiz_questions").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("quiz_questions").insert(payload);
    }
    toast.success("Questão salva!"); setDialogOpen(false); setEditing(null);
    setForm({ materia: "", pergunta: "", opcao1: "", opcao2: "", opcao3: "", opcao4: "", correta: "0" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("quiz_questions").delete().eq("id", id);
    toast.success("Removida!"); load();
  };

  const edit = (item: QuizQuestion) => {
    setEditing(item);
    setForm({
      materia: item.materia, pergunta: item.pergunta,
      opcao1: item.opcoes[0] || "", opcao2: item.opcoes[1] || "",
      opcao3: item.opcoes[2] || "", opcao4: item.opcoes[3] || "",
      correta: String(item.correta),
    });
    setDialogOpen(true);
  };

  return (
    <CrudSection title="Quiz" count={items.length} onAdd={() => { setEditing(null); setForm({ materia: "", pergunta: "", opcao1: "", opcao2: "", opcao3: "", opcao4: "", correta: "0" }); setDialogOpen(true); }}>
      <Table>
        <TableHeader><TableRow><TableHead>Matéria</TableHead><TableHead>Pergunta</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell><Badge variant="outline" className="text-primary border-primary/30">{item.materia}</Badge></TableCell>
              <TableCell className="font-mono text-sm">{item.pergunta}</TableCell>
              <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => edit(item)}><Edit2 className="h-3 w-3" /></Button><Button variant="ghost" size="icon" onClick={() => remove(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Nova"} Questão</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={form.materia} onValueChange={(v) => setForm({ ...form, materia: v })}>
              <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
              <SelectContent>{materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Pergunta" value={form.pergunta} onChange={(e) => setForm({ ...form, pergunta: e.target.value })} />
            {[1, 2, 3, 4].map((n) => (
              <Input key={n} placeholder={`Opção ${n}`} value={(form as any)[`opcao${n}`]} onChange={(e) => setForm({ ...form, [`opcao${n}`]: e.target.value })} />
            ))}
            <Select value={form.correta} onValueChange={(v) => setForm({ ...form, correta: v })}>
              <SelectTrigger><SelectValue placeholder="Resposta correta" /></SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3].map((i) => <SelectItem key={i} value={String(i)}>Opção {i + 1}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}



// ─── MENSAGENS TAB ───────────────────────────────────────
function MensagensTab() {
  const [items, setItems] = useState<{ id: string; remetente: string; conteudo: string; lida: boolean; created_at: string }[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");

  const load = async () => {
    const { data } = await supabase.from("mensagens").select("*").order("created_at", { ascending: true });
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const enviar = async () => {
    if (!novaMensagem.trim()) return;
    await supabase.from("mensagens").insert({ remetente: "admin", conteudo: novaMensagem.trim() });
    setNovaMensagem("");
    toast.success("Mensagem enviada!");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("mensagens").delete().eq("id", id);
    toast.success("Removida!");
    load();
  };

  return (
    <Card className="bg-card border-border mt-4">
      <CardHeader>
        <CardTitle className="font-mono text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-accent" /> Chat com Bella
          <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem ainda.</p>
          )}
          {items.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-2 ${msg.remetente === "admin" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                msg.remetente === "admin" ? "bg-primary/20 text-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
              }`}>
                <p className="text-[10px] font-mono text-muted-foreground mb-1">{msg.remetente === "admin" ? "Você" : "Bella"}</p>
                <p>{msg.conteudo}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(msg.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                </p>
              </div>
              {msg.remetente === "admin" && (
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => remove(msg.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-border pt-4">
          <Input
            placeholder="Enviar mensagem para Bella..."
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
            className="flex-1"
          />
          <Button onClick={enviar} disabled={!novaMensagem.trim()} className="gap-1">
            <Send className="h-4 w-4" /> Enviar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MÓDULOS TAB ─────────────────────────────────────────
function ModulosTab() {
  const [modulos, setModulos] = useState<{ id: string; nome: string; descricao: string | null; ordem: number }[]>([]);
  const [topicos, setTopicos] = useState<{ id: string; modulo_id: string; titulo: string; conteudo: string; ordem: number }[]>([]);
  const [moduloDialogOpen, setModuloDialogOpen] = useState(false);
  const [topicoDialogOpen, setTopicoDialogOpen] = useState(false);
  const [editingModulo, setEditingModulo] = useState<any>(null);
  const [editingTopico, setEditingTopico] = useState<any>(null);
  const [selectedModuloId, setSelectedModuloId] = useState<string | null>(null);
  const [moduloForm, setModuloForm] = useState({ nome: "", descricao: "" });
  const [topicoForm, setTopicoForm] = useState({ titulo: "", conteudo: "" });

  const loadAll = async () => {
    const [mRes, tRes] = await Promise.all([
      supabase.from("modulos").select("*").order("ordem"),
      supabase.from("modulo_topicos").select("*").order("ordem"),
    ]);
    if (mRes.data) setModulos(mRes.data);
    if (tRes.data) setTopicos(tRes.data);
  };
  useEffect(() => { loadAll(); }, []);

  const saveModulo = async () => {
    if (!moduloForm.nome) return;
    const payload = { nome: moduloForm.nome, descricao: moduloForm.descricao || null, ordem: editingModulo ? editingModulo.ordem : modulos.length };
    if (editingModulo) {
      await supabase.from("modulos").update(payload).eq("id", editingModulo.id);
    } else {
      await supabase.from("modulos").insert(payload);
    }
    toast.success("Módulo salvo!"); setModuloDialogOpen(false); setEditingModulo(null); setModuloForm({ nome: "", descricao: "" }); loadAll();
  };

  const removeModulo = async (id: string) => {
    await supabase.from("modulos").delete().eq("id", id);
    toast.success("Módulo removido!"); loadAll();
  };

  const saveTopico = async () => {
    if (!topicoForm.titulo || !topicoForm.conteudo || !selectedModuloId) return;
    const moduloTopicos = topicos.filter(t => t.modulo_id === selectedModuloId);
    const payload = { modulo_id: selectedModuloId, titulo: topicoForm.titulo, conteudo: topicoForm.conteudo, ordem: editingTopico ? editingTopico.ordem : moduloTopicos.length };
    if (editingTopico) {
      await supabase.from("modulo_topicos").update(payload).eq("id", editingTopico.id);
    } else {
      await supabase.from("modulo_topicos").insert(payload);
    }
    toast.success("Tópico salvo!"); setTopicoDialogOpen(false); setEditingTopico(null); setTopicoForm({ titulo: "", conteudo: "" }); loadAll();
  };

  const removeTopico = async (id: string) => {
    await supabase.from("modulo_topicos").delete().eq("id", id);
    toast.success("Tópico removido!"); loadAll();
  };

  const selectedTopicos = topicos.filter(t => t.modulo_id === selectedModuloId);

  return (
    <Card className="bg-card border-border mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="font-mono text-lg flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" /> Módulos <Badge variant="secondary">{modulos.length}</Badge>
        </CardTitle>
        <Button onClick={() => { setEditingModulo(null); setModuloForm({ nome: "", descricao: "" }); setModuloDialogOpen(true); }} size="sm" className="gap-1">
          <Plus className="h-3 w-3" /> Novo Módulo
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Módulos list */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tópicos</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modulos.map((mod) => (
              <TableRow key={mod.id} className={selectedModuloId === mod.id ? "bg-primary/5" : ""}>
                <TableCell className="font-mono text-sm">{mod.ordem + 1}</TableCell>
                <TableCell>
                  <button onClick={() => setSelectedModuloId(selectedModuloId === mod.id ? null : mod.id)} className="font-mono text-sm text-primary hover:underline">
                    {mod.nome}
                  </button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{mod.descricao || "—"}</TableCell>
                <TableCell><Badge variant="secondary">{topicos.filter(t => t.modulo_id === mod.id).length}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingModulo(mod); setModuloForm({ nome: mod.nome, descricao: mod.descricao || "" }); setModuloDialogOpen(true); }}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeModulo(mod.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Tópicos do módulo selecionado */}
        {selectedModuloId && (
          <Card className="bg-secondary/30 border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="font-mono text-sm">
                Tópicos de: {modulos.find(m => m.id === selectedModuloId)?.nome}
              </CardTitle>
              <Button onClick={() => { setEditingTopico(null); setTopicoForm({ titulo: "", conteudo: "" }); setTopicoDialogOpen(true); }} size="sm" variant="outline" className="gap-1">
                <Plus className="h-3 w-3" /> Novo Tópico
              </Button>
            </CardHeader>
            <CardContent>
              {selectedTopicos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum tópico ainda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Conteúdo</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTopicos.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-sm">{t.ordem + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{t.titulo}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">{t.conteudo}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingTopico(t); setTopicoForm({ titulo: t.titulo, conteudo: t.conteudo }); setTopicoDialogOpen(true); }}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeTopico(t.id)}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </CardContent>

      {/* Módulo Dialog */}
      <Dialog open={moduloDialogOpen} onOpenChange={setModuloDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editingModulo ? "Editar" : "Novo"} Módulo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome do módulo (ex: Banco de Dados)" value={moduloForm.nome} onChange={(e) => setModuloForm({ ...moduloForm, nome: e.target.value })} />
            <Input placeholder="Descrição (opcional)" value={moduloForm.descricao} onChange={(e) => setModuloForm({ ...moduloForm, descricao: e.target.value })} />
            <Button onClick={saveModulo} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tópico Dialog */}
      <Dialog open={topicoDialogOpen} onOpenChange={setTopicoDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editingTopico ? "Editar" : "Novo"} Tópico</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título do tópico" value={topicoForm.titulo} onChange={(e) => setTopicoForm({ ...topicoForm, titulo: e.target.value })} />
            <Textarea placeholder="Conteúdo do tópico" rows={8} value={topicoForm.conteudo} onChange={(e) => setTopicoForm({ ...topicoForm, conteudo: e.target.value })} />
            <Button onClick={saveTopico} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── SHARED SECTION WRAPPER ──────────────────────────────
function CrudSection({ title, count, onAdd, children }: { title: string; count: number; onAdd: () => void; children: React.ReactNode }) {
  return (
    <Card className="bg-card border-border mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="font-mono text-lg flex items-center gap-2">
          {title} <Badge variant="secondary">{count}</Badge>
        </CardTitle>
        <Button onClick={onAdd} size="sm" className="gap-1"><Plus className="h-3 w-3" /> Adicionar</Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default Admin;
