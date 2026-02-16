import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Shield, BookOpen, BrainCircuit, Plus, Edit2, Trash2, LogOut, Lock, MessageCircle, Send, GraduationCap, ArrowUp, ArrowDown, Trophy, Sparkles, Tag, Library, PlayCircle, User, Upload, Bot, Image, Video, Clock, ChevronLeft, Award, Loader2, Reply, Pencil, Check, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMaterias } from "@/hooks/useMaterias";

const ADMIN_PASSWORD = "bella2024";

// Types
interface Resumo { id: string; materia: string; titulo: string; conteudo: string; created_at: string; }
interface Flashcard { id: string; materia: string; pergunta: string; resposta: string; created_at: string; }
interface QuizQuestion { id: string; materia: string; pergunta: string; opcoes: string[]; correta: number; created_at: string; }
interface CronogramaItem { id: string; titulo: string; materia: string; dia_semana: number; horario: string; concluida: boolean; created_at: string; }
interface Anotacao { id: string; titulo: string; conteudo: string; materia: string | null; tags: string[] | null; created_at: string; }

const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type AdminSection = 
  | "dashboard" | "cursos" | "modulos" | "materias" | "resumos" 
  | "flashcards" | "quiz" | "videos" | "desafios" | "frases" 
  | "mensagens" | "perfil" | "belinha" | "certificados" | "resgates";

const adminSections = [
  {
    group: "📂 Conteúdo",
    items: [
      { key: "cursos" as AdminSection, label: "Cursos", icon: Library, desc: "Gerenciar cursos" },
      { key: "modulos" as AdminSection, label: "Módulos", icon: GraduationCap, desc: "Módulos e tópicos" },
      { key: "videos" as AdminSection, label: "Vídeos", icon: PlayCircle, desc: "Videoaulas e mix" },
    ],
  },
  {
    group: "📚 Estudo",
    items: [
      { key: "materias" as AdminSection, label: "Matérias", icon: Tag, desc: "Categorias de matérias" },
      { key: "resumos" as AdminSection, label: "Resumos", icon: BookOpen, desc: "Resumos de conteúdo" },
      { key: "flashcards" as AdminSection, label: "Flashcards", icon: BrainCircuit, desc: "Cartões de estudo" },
      { key: "quiz" as AdminSection, label: "Quiz", icon: BrainCircuit, desc: "Questões de quiz" },
    ],
  },
  {
    group: "💬 Engajamento",
    items: [
      { key: "desafios" as AdminSection, label: "Desafios", icon: Trophy, desc: "Desafios semanais" },
      { key: "frases" as AdminSection, label: "Frases", icon: Sparkles, desc: "Frases motivacionais" },
      { key: "mensagens" as AdminSection, label: "Chat", icon: MessageCircle, desc: "Mensagens com aluna" },
    ],
  },
  {
    group: "⚙️ Configurações",
    items: [
      { key: "certificados" as AdminSection, label: "Certificados", icon: Award, desc: "Solicitações e config" },
      { key: "resgates" as AdminSection, label: "Resgates", icon: Award, desc: "Solicitações de resgate PIX" },
      { key: "perfil" as AdminSection, label: "Perfil Admin", icon: User, desc: "Nome e foto do admin" },
      { key: "belinha" as AdminSection, label: "Belinha IA", icon: Bot, desc: "Assistente e stories" },
    ],
  },
];

const Admin = () => {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");

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
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-mono font-bold">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Digite a senha para acessar</p>
          </motion.div>
          <Card className="bg-card border-border">
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

  const renderContent = () => {
    switch (activeSection) {
      case "cursos": return <CursosTab />;
      case "modulos": return <ModulosTab />;
      case "materias": return <MateriasTab />;
      case "resumos": return <ResumosTab />;
      case "flashcards": return <FlashcardsTab />;
      case "quiz": return <QuizTab />;
      case "videos": return <VideosTab />;
      case "desafios": return <DesafiosTab />;
      case "frases": return <FrasesTab />;
      case "mensagens": return <MensagensTab />;
      case "perfil": return <AdminConfigTab />;
      case "belinha": return <BelinhaConfigTab />;
      case "certificados": return <CertificadosTab />;
      case "resgates": return <ResgatesTab />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-5 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeSection !== "dashboard" && (
              <Button variant="ghost" size="icon" onClick={() => setActiveSection("dashboard")} className="shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-mono font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {activeSection === "dashboard" ? "Painel Admin" : adminSections.flatMap(g => g.items).find(i => i.key === activeSection)?.label}
              </h1>
              <p className="text-xs text-muted-foreground">
                {activeSection === "dashboard" ? "Gerencie todo o conteúdo do app" : adminSections.flatMap(g => g.items).find(i => i.key === activeSection)?.desc}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setAutenticado(false)} className="gap-1.5 text-xs">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {activeSection === "dashboard" ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              {adminSections.map((group) => (
                <div key={group.group} className="space-y-2.5">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider px-1"><span className="emoji-fix mr-1">{group.group.split(" ")[0]}</span>{group.group.split(" ").slice(1).join(" ")}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setActiveSection(item.key)}
                          className="flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                        >
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium font-mono">{item.label}</p>
                            <p className="text-[11px] text-muted-foreground leading-tight">{item.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
            >
              {renderContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

// ─── CURSOS TAB ─────────────────────────────────────────
function CursosTab() {
  const [items, setItems] = useState<{ id: string; nome: string; descricao: string | null; ordem: number }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nome: "", descricao: "" });

  const load = async () => {
    const { data } = await supabase.from("cursos").select("*").order("ordem");
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nome) return;
    const payload = { nome: form.nome, descricao: form.descricao || null, ordem: editing ? editing.ordem : items.length };
    if (editing) {
      await supabase.from("cursos").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("cursos").insert(payload);
    }
    toast.success("Curso salvo!"); setDialogOpen(false); setEditing(null); setForm({ nome: "", descricao: "" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("cursos").delete().eq("id", id);
    toast.success("Curso removido!"); load();
  };

  return (
    <CrudSection title="Cursos" count={items.length} onAdd={() => { setEditing(null); setForm({ nome: "", descricao: "" }); setDialogOpen(true); }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.ordem + 1}</TableCell>
              <TableCell className="font-mono text-sm">{item.nome}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.descricao || "—"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setForm({ nome: item.nome, descricao: item.descricao || "" }); setDialogOpen(true); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Novo"} Curso</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome do curso (ex: Sistemas de Informação)" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            <Input placeholder="Descrição (opcional)" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}

function MateriasTab() {
  const { materias, reload } = useMaterias();
  const [novaMateria, setNovaMateria] = useState("");

  const add = async () => {
    if (!novaMateria.trim()) return;
    const { error } = await supabase.from("materias").insert({ nome: novaMateria.trim() });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Matéria já existe!" : "Erro ao adicionar");
    } else {
      toast.success("Matéria adicionada!");
      setNovaMateria("");
      reload();
    }
  };

  const remove = async (nome: string) => {
    await supabase.from("materias").delete().eq("nome", nome);
    toast.success("Matéria removida!");
    reload();
  };

  return (
    <CrudSection title="Matérias" count={materias.length} onAdd={() => {}}>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Nome da matéria (ex: Direito Civil)"
          value={novaMateria}
          onChange={(e) => setNovaMateria(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          className="flex-1"
        />
        <Button onClick={add} className="gap-1.5">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {materias.map((m) => (
          <Badge key={m} variant="secondary" className="text-sm py-1.5 px-3 gap-2">
            {m}
            <button onClick={() => remove(m)} className="text-destructive hover:text-destructive/80 transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      {materias.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma matéria cadastrada. Adicione acima!</p>
      )}
    </CrudSection>
  );
}

// ─── RESUMOS TAB ─────────────────────────────────────────
function ResumosTab() {
  const [items, setItems] = useState<Resumo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Resumo | null>(null);
  const [form, setForm] = useState({ materia: "", titulo: "", conteudo: "" });
  const { materias } = useMaterias();

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
  const { materias } = useMaterias();

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
  const { materias } = useMaterias();

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
      // Criar notificação para Bella sobre novo quiz
      await supabase.from("notificacoes").insert({
        titulo: "Novo Quiz disponível! 🎯",
        mensagem: `Nova questão de ${form.materia} foi adicionada. Teste seus conhecimentos!`,
        tipo: "novo_conteudo",
        link: "/flashcards",
      });
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
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono">{editing ? "Editar" : "Nova"} Questão</DialogTitle>
            <DialogDescription>Preencha os campos abaixo para {editing ? "editar a" : "criar uma nova"} questão de quiz.</DialogDescription>
          </DialogHeader>
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


// ─── DESAFIOS SEMANAIS TAB ──────────────────────────────
interface DesafioSemanal { id: string; pergunta: string; opcoes: string[]; correta: number; moedas: number; created_at: string; }

function DesafiosTab() {
  const [items, setItems] = useState<DesafioSemanal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DesafioSemanal | null>(null);
  const [form, setForm] = useState({ pergunta: "", opcao1: "", opcao2: "", opcao3: "", opcao4: "", correta: "0", moedas: "5" });

  const load = async () => {
    const { data } = await supabase.from("desafios_semanais").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as DesafioSemanal[]);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.pergunta || !form.opcao1 || !form.opcao2 || !form.opcao3 || !form.opcao4) return;
    const payload = {
      pergunta: form.pergunta,
      opcoes: [form.opcao1, form.opcao2, form.opcao3, form.opcao4],
      correta: parseInt(form.correta),
      moedas: parseInt(form.moedas) || 5,
    };
    if (editing) {
      await supabase.from("desafios_semanais").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("desafios_semanais").insert(payload);
      await supabase.from("notificacoes").insert({
        titulo: "Novo desafio semanal! 🏆",
        mensagem: `Um novo desafio foi adicionado. Teste seus conhecimentos!`,
        tipo: "novo_conteudo",
        link: "/desafios",
      });
    }
    toast.success("Desafio salvo!"); setDialogOpen(false); setEditing(null);
    setForm({ pergunta: "", opcao1: "", opcao2: "", opcao3: "", opcao4: "", correta: "0", moedas: "5" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("desafios_semanais").delete().eq("id", id);
    toast.success("Removido!"); load();
  };

  const edit = (item: DesafioSemanal) => {
    setEditing(item);
    setForm({
      pergunta: item.pergunta,
      opcao1: item.opcoes[0] || "", opcao2: item.opcoes[1] || "",
      opcao3: item.opcoes[2] || "", opcao4: item.opcoes[3] || "",
      correta: String(item.correta),
      moedas: String(item.moedas ?? 5),
    });
    setDialogOpen(true);
  };

  const resetDesafio = async (id: string) => {
    await supabase.from("desafio_respostas").delete().eq("desafio_id", id);
    toast.success("Respostas resetadas!"); load();
  };

  return (
    <CrudSection title="Desafios da Semana" count={items.length} onAdd={() => { setEditing(null); setForm({ pergunta: "", opcao1: "", opcao2: "", opcao3: "", opcao4: "", correta: "0", moedas: "5" }); setDialogOpen(true); }}>
      <Table>
        <TableHeader><TableRow><TableHead>Pergunta</TableHead><TableHead className="w-32">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.pergunta}</TableCell>
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
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Novo"} Desafio</DialogTitle></DialogHeader>
          <div className="space-y-4">
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
            <Input placeholder="Moedas por acerto (ex: 5)" type="number" value={form.moedas} onChange={(e) => setForm({ ...form, moedas: e.target.value })} />
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}
// ─── RESGATES TAB ──────────────────────────────────
function ResgatesTab() {
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: sols } = await supabase
      .from("resgate_solicitacoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (sols) {
      const userIds = [...new Set(sols.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setSolicitacoes(sols.map((s: any) => ({ ...s, profile: profileMap.get(s.user_id) })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markAsPaid = async (id: string) => {
    await supabase.from("resgate_solicitacoes").update({ status: "pago" }).eq("id", id);
    toast.success("Resgate marcado como pago!");
    load();
  };

  return (
    <div className="space-y-6 mt-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-mono text-base flex items-center gap-2">
            Solicitações de Resgate <Badge variant="secondary">{solicitacoes.filter((s: any) => s.status === "pendente").length} pendentes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : solicitacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma solicitação ainda.</p>
          ) : (
            <div className="space-y-3">
              {solicitacoes.map((s: any) => (
                <div key={s.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${s.status === "pendente" ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                  <div>
                    <p className="text-sm font-mono font-medium">{s.profile?.display_name || "Desconhecido"}</p>
                    <p className="text-[10px] text-muted-foreground">{s.valor_moedas} moedas • {new Date(s.created_at).toLocaleDateString("pt-BR")}</p>
                    <p className="text-xs text-foreground mt-1">PIX: <span className="font-mono">{s.chave_pix}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === "pago" ? (
                      <Badge className="bg-primary/20 text-primary border-0">Pago ✓</Badge>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => markAsPaid(s.id)}>
                        <Check className="h-3.5 w-3.5" />
                        Marcar como pago
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


interface MensagemFull {
  id: string;
  remetente: string;
  conteudo: string;
  lida: boolean;
  created_at: string;
  reply_to: string | null;
  editado: boolean;
}

function MensagensTab() {
  const [items, setItems] = useState<MensagemFull[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [replyTo, setReplyTo] = useState<MensagemFull | null>(null);
  const [editingMsg, setEditingMsg] = useState<MensagemFull | null>(null);
  const [longPressMsg, setLongPressMsg] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("mensagens").select("*").order("created_at", { ascending: true });
    if (data) setItems(data);
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel("admin-mensagens-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens" }, (payload) => {
        const newMsg = payload.new as MensagemFull;
        setItems((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mensagens" }, (payload) => {
        const updated = payload.new as MensagemFull;
        setItems((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "mensagens" }, (payload) => {
        const old = payload.old as { id: string };
        setItems((prev) => prev.filter((m) => m.id !== old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  const enviar = async () => {
    if (!novaMensagem.trim()) return;
    const texto = novaMensagem.trim();
    setNovaMensagem("");

    if (editingMsg) {
      await supabase.from("mensagens").update({ conteudo: texto, editado: true }).eq("id", editingMsg.id);
      setEditingMsg(null);
      return;
    }

    const payload: any = { remetente: "admin", conteudo: texto };
    if (replyTo) {
      payload.reply_to = replyTo.id;
      setReplyTo(null);
    }
    await supabase.from("mensagens").insert(payload);
  };

  const remove = async (msg: MensagemFull) => {
    await supabase.from("mensagens").delete().eq("id", msg.id);
    setItems((prev) => prev.filter((m) => m.id !== msg.id));
    setLongPressMsg(null);
  };

  const canEdit = (msg: MensagemFull) => {
    if (msg.remetente !== "admin") return false;
    return Date.now() - new Date(msg.created_at).getTime() < 3 * 60 * 1000;
  };

  const startEdit = (msg: MensagemFull) => {
    setEditingMsg(msg);
    setReplyTo(null);
    setNovaMensagem(msg.conteudo);
    setLongPressMsg(null);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingMsg(null);
    setNovaMensagem("");
  };

  const handleReply = (msg: MensagemFull) => {
    setReplyTo(msg);
    setEditingMsg(null);
    setNovaMensagem("");
    setLongPressMsg(null);
    inputRef.current?.focus();
  };

  const getReplyPreview = (replyId: string | null) => {
    if (!replyId) return null;
    return items.find((m) => m.id === replyId);
  };

  const formatMsgTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / 3600000;
    if (diffH < 24) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card className="bg-card border-border mt-4">
      <CardHeader>
        <CardTitle className="font-mono text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-accent" /> Chat com Bella
          <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1" onClick={() => setLongPressMsg(null)}>
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem ainda.</p>
          )}
          {items.map((msg) => {
            const isAdmin = msg.remetente === "admin";
            const replyMsg = getReplyPreview(msg.reply_to);
            return (
              <motion.div
                key={msg.id}
                className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} relative group`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.3}
                onDragEnd={(_e: any, info: PanInfo) => {
                  if (Math.abs(info.offset.x) > 50) handleReply(msg);
                }}
                style={{ touchAction: "pan-y" }}
              >
                {replyMsg && (
                  <div className={`max-w-[75%] mb-1 px-2.5 py-1 rounded-lg bg-secondary/30 border-l-2 border-primary/30 ${isAdmin ? "mr-1" : "ml-1"}`}>
                    <p className="text-[9px] font-medium text-primary/60">
                      {replyMsg.remetente === "admin" ? "Você" : "Bella"}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 truncate">{replyMsg.conteudo}</p>
                  </div>
                )}

                <div className="relative max-w-[80%]">
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed select-none ${
                      isAdmin
                        ? "bg-primary/20 text-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    } ${longPressMsg === msg.id ? "ring-1 ring-primary/30" : ""}`}
                    onTouchStart={() => {
                      longPressTimer.current = setTimeout(() => {
                        longPressTimer.current = null;
                        setLongPressMsg(msg.id);
                      }, 500);
                    }}
                    onTouchEnd={(e) => {
                      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                      if (longPressMsg === msg.id) e.preventDefault();
                    }}
                    onMouseDown={() => {
                      longPressTimer.current = setTimeout(() => {
                        longPressTimer.current = null;
                        setLongPressMsg(msg.id);
                      }, 500);
                    }}
                    onMouseUp={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
                    onContextMenu={(e) => { e.preventDefault(); setLongPressMsg(msg.id); }}
                  >
                    <p className="text-[10px] font-mono text-muted-foreground mb-0.5">{isAdmin ? "Você" : "Bella"}</p>
                    <span>{msg.conteudo}</span>
                    <span className="inline-flex items-center gap-1 ml-2 align-bottom text-[8px] whitespace-nowrap text-muted-foreground/35">
                      {msg.editado && <span>editado ·</span>}
                      {formatMsgTime(msg.created_at)}
                    </span>
                  </div>

                  <AnimatePresence>
                    {longPressMsg === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute -top-11 ${isAdmin ? "right-0" : "left-0"} z-10 flex items-center gap-0.5 rounded-xl bg-card/95 backdrop-blur-xl border border-border/30 shadow-lg px-1 py-1`}
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleReply(msg)}
                          className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                        >
                          <Reply className="h-3 w-3" />
                          <span>Responder</span>
                        </button>
                        {canEdit(msg) && (
                          <button
                            onClick={() => startEdit(msg)}
                            className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Editar</span>
                          </button>
                        )}
                        <button
                          onClick={() => remove(msg)}
                          className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Apagar</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply / Edit bar */}
        <AnimatePresence>
          {(replyTo || editingMsg) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-3 py-2 bg-secondary/20 rounded-lg flex items-center gap-2">
                {replyTo && (
                  <>
                    <Reply className="h-3 w-3 text-primary/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-medium text-primary/70">{replyTo.remetente === "admin" ? "Você" : "Bella"}</p>
                      <p className="text-[9px] text-muted-foreground/50 truncate">{replyTo.conteudo}</p>
                    </div>
                  </>
                )}
                {editingMsg && (
                  <>
                    <Pencil className="h-3 w-3 text-primary/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-medium text-primary/70">Editando</p>
                      <p className="text-[9px] text-muted-foreground/50 truncate">{editingMsg.conteudo}</p>
                    </div>
                  </>
                )}
                <button onClick={() => { setReplyTo(null); cancelEdit(); }} className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-secondary/50 transition-colors">
                  <X className="h-2.5 w-2.5 text-muted-foreground/50" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 border-t border-border pt-3">
          <Input
            ref={inputRef}
            placeholder={editingMsg ? "Editar mensagem..." : "Enviar mensagem para Bella..."}
            value={novaMensagem}
            onChange={(e) => setNovaMensagem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar();
              if (e.key === "Escape") { setReplyTo(null); cancelEdit(); }
            }}
            className="flex-1"
          />
          <Button onClick={enviar} disabled={!novaMensagem.trim()} className="gap-1">
            {editingMsg ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {editingMsg ? "Salvar" : "Enviar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MÓDULOS TAB ─────────────────────────────────────────
function ModulosTab() {
  const [cursos, setCursos] = useState<{ id: string; nome: string }[]>([]);
  const [modulos, setModulos] = useState<{ id: string; nome: string; descricao: string | null; ordem: number; curso_id: string | null }[]>([]);
  const [topicos, setTopicos] = useState<{ id: string; modulo_id: string; titulo: string; conteudo: string; ordem: number; moedas: number }[]>([]);
  const [moduloDialogOpen, setModuloDialogOpen] = useState(false);
  const [topicoDialogOpen, setTopicoDialogOpen] = useState(false);
  const [editingModulo, setEditingModulo] = useState<any>(null);
  const [editingTopico, setEditingTopico] = useState<any>(null);
  const [selectedModuloId, setSelectedModuloId] = useState<string | null>(null);
  const [selectedCursoFilter, setSelectedCursoFilter] = useState<string>("all");
  const [moduloForm, setModuloForm] = useState({ nome: "", descricao: "", curso_id: "" });
  const [topicoForm, setTopicoForm] = useState({ titulo: "", conteudo: "", moedas: "5" });

  const loadAll = async () => {
    const [cRes, mRes, tRes] = await Promise.all([
      supabase.from("cursos").select("id, nome").order("ordem"),
      supabase.from("modulos").select("*").order("ordem"),
      supabase.from("modulo_topicos").select("*").order("ordem"),
    ]);
    if (cRes.data) setCursos(cRes.data);
    if (mRes.data) setModulos(mRes.data);
    if (tRes.data) setTopicos(tRes.data);
  };
  useEffect(() => { loadAll(); }, []);

  const saveModulo = async () => {
    if (!moduloForm.nome || !moduloForm.curso_id) return;
    const payload = { nome: moduloForm.nome, descricao: moduloForm.descricao || null, curso_id: moduloForm.curso_id, ordem: editingModulo ? editingModulo.ordem : modulos.length };
    if (editingModulo) {
      await supabase.from("modulos").update(payload).eq("id", editingModulo.id);
    } else {
      await supabase.from("modulos").insert(payload);
    }
    toast.success("Módulo salvo!"); setModuloDialogOpen(false); setEditingModulo(null); setModuloForm({ nome: "", descricao: "", curso_id: "" }); loadAll();
  };

  const removeModulo = async (id: string) => {
    await supabase.from("modulos").delete().eq("id", id);
    toast.success("Módulo removido!"); loadAll();
  };

  const saveTopico = async () => {
    if (!topicoForm.titulo || !topicoForm.conteudo || !selectedModuloId) return;
    const moduloTopicos = topicos.filter(t => t.modulo_id === selectedModuloId);
    const payload = { modulo_id: selectedModuloId, titulo: topicoForm.titulo, conteudo: topicoForm.conteudo, moedas: parseInt(topicoForm.moedas) || 5, ordem: editingTopico ? editingTopico.ordem : moduloTopicos.length };
    if (editingTopico) {
      await supabase.from("modulo_topicos").update(payload).eq("id", editingTopico.id);
    } else {
      await supabase.from("modulo_topicos").insert(payload);
    }
    toast.success("Tópico salvo!"); setTopicoDialogOpen(false); setEditingTopico(null); setTopicoForm({ titulo: "", conteudo: "", moedas: "5" }); loadAll();
  };

  const removeTopico = async (id: string) => {
    await supabase.from("modulo_topicos").delete().eq("id", id);
    toast.success("Tópico removido!"); loadAll();
  };

  const filteredModulos = selectedCursoFilter === "all" ? modulos : modulos.filter(m => m.curso_id === selectedCursoFilter);
  const selectedTopicos = topicos.filter(t => t.modulo_id === selectedModuloId);

  return (
    <Card className="bg-card border-border mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="font-mono text-lg flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" /> Módulos <Badge variant="secondary">{filteredModulos.length}</Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={selectedCursoFilter} onValueChange={setSelectedCursoFilter}>
            <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue placeholder="Filtrar por curso" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cursos</SelectItem>
              {cursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingModulo(null); setModuloForm({ nome: "", descricao: "", curso_id: "" }); setModuloDialogOpen(true); }} size="sm" className="gap-1">
            <Plus className="h-3 w-3" /> Novo Módulo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Módulos list */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Tópicos</TableHead>
              <TableHead className="w-32">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModulos.map((mod) => (
              <TableRow key={mod.id} className={selectedModuloId === mod.id ? "bg-primary/5" : ""}>
                <TableCell className="font-mono text-sm">{mod.ordem + 1}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{cursos.find(c => c.id === mod.curso_id)?.nome || "—"}</Badge></TableCell>
                <TableCell>
                  <button onClick={() => setSelectedModuloId(selectedModuloId === mod.id ? null : mod.id)} className="font-mono text-sm text-primary hover:underline">
                    {mod.nome}
                  </button>
                </TableCell>
                <TableCell><Badge variant="secondary">{topicos.filter(t => t.modulo_id === mod.id).length}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingModulo(mod); setModuloForm({ nome: mod.nome, descricao: mod.descricao || "", curso_id: mod.curso_id || "" }); setModuloDialogOpen(true); }}>
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
              <Button onClick={() => { setEditingTopico(null); setTopicoForm({ titulo: "", conteudo: "", moedas: "5" }); setTopicoDialogOpen(true); }} size="sm" variant="outline" className="gap-1">
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
                            <Button variant="ghost" size="icon" onClick={() => { setEditingTopico(t); setTopicoForm({ titulo: t.titulo, conteudo: t.conteudo, moedas: String(t.moedas ?? 5) }); setTopicoDialogOpen(true); }}>
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
            <Select value={moduloForm.curso_id} onValueChange={(v) => setModuloForm({ ...moduloForm, curso_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
              <SelectContent>{cursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
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
            <Input placeholder="Moedas por conclusão (ex: 5)" type="number" value={topicoForm.moedas} onChange={(e) => setTopicoForm({ ...topicoForm, moedas: e.target.value })} />
            <Button onClick={saveTopico} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── FRASES MOTIVACIONAIS TAB ────────────────────────────
interface FraseMotivacional { id: string; texto: string; ativa: boolean; created_at: string; }

function FrasesTab() {
  const [items, setItems] = useState<FraseMotivacional[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FraseMotivacional | null>(null);
  const [form, setForm] = useState({ texto: "" });

  const load = async () => {
    const { data } = await supabase.from("frases_motivacionais").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as FraseMotivacional[]);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.texto) return;
    if (editing) {
      await supabase.from("frases_motivacionais").update({ texto: form.texto }).eq("id", editing.id);
    } else {
      await supabase.from("frases_motivacionais").insert({ texto: form.texto });
    }
    toast.success("Frase salva!"); setDialogOpen(false); setEditing(null); setForm({ texto: "" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("frases_motivacionais").delete().eq("id", id);
    toast.success("Removida!"); load();
  };

  const toggleAtiva = async (item: FraseMotivacional) => {
    await supabase.from("frases_motivacionais").update({ ativa: !item.ativa }).eq("id", item.id);
    load();
  };

  return (
    <CrudSection title="Frases Motivacionais" count={items.length} onAdd={() => { setEditing(null); setForm({ texto: "" }); setDialogOpen(true); }}>
      <Table>
        <TableHeader><TableRow><TableHead>Frase</TableHead><TableHead className="w-20">Ativa</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className={!item.ativa ? "opacity-50" : ""}>
              <TableCell className="text-sm">{item.texto}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => toggleAtiva(item)} className="text-xs">
                  {item.ativa ? "✅" : "❌"}
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setForm({ texto: item.texto }); setDialogOpen(true); }}><Edit2 className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Nova"} Frase</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Digite a frase motivacional..." rows={3} value={form.texto} onChange={(e) => setForm({ texto: e.target.value })} />
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}

// ─── VIDEOS TAB ──────────────────────────────────────────
interface VideoItem { id: string; titulo: string; descricao: string | null; url_youtube: string; duracao: number; ordem: number; categoria_id: string | null; }
interface VideoCategoria { id: string; nome: string; ordem: number; }

function VideosTab() {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [categorias, setCategorias] = useState<VideoCategoria[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VideoItem | null>(null);
  const [editingCat, setEditingCat] = useState<VideoCategoria | null>(null);
  const [form, setForm] = useState({ titulo: "", descricao: "", url_youtube: "", duracao: "", categoria_id: "", moedas: "0" });
  const [catForm, setCatForm] = useState({ nome: "" });
  const [fetchingDuration, setFetchingDuration] = useState(false);

  const load = async () => {
    const [videosRes, catsRes] = await Promise.all([
      supabase.from("videos").select("*").order("ordem"),
      supabase.from("video_categorias").select("*").order("ordem"),
    ]);
    if (videosRes.data) setItems(videosRes.data as VideoItem[]);
    if (catsRes.data) setCategorias(catsRes.data);
  };
  useEffect(() => { load(); }, []);

  const fetchDuration = async (url: string) => {
    if (!url.includes("youtu")) return;
    setFetchingDuration(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-youtube-duration", { body: { url } });
      if (!error && data?.success) {
        setForm((prev) => ({ ...prev, duracao: String(data.duration) }));
      }
    } catch (e) {
      console.error("Error fetching duration:", e);
    } finally {
      setFetchingDuration(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setForm((prev) => ({ ...prev, url_youtube: url }));
    fetchDuration(url);
  };

  const save = async () => {
    if (!form.titulo || !form.url_youtube) return;
    const payload = {
      titulo: form.titulo,
      descricao: form.descricao || null,
      url_youtube: form.url_youtube,
      duracao: parseInt(form.duracao) || 0,
      ordem: editing ? editing.ordem : items.length,
      categoria_id: form.categoria_id || null,
      moedas: parseInt(form.moedas) || 0,
    };
    if (editing) {
      await supabase.from("videos").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("videos").insert(payload);
    }
    toast.success("Vídeo salvo!"); setDialogOpen(false); setEditing(null); setForm({ titulo: "", descricao: "", url_youtube: "", duracao: "", categoria_id: "", moedas: "0" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("videos").delete().eq("id", id);
    toast.success("Removido!"); load();
  };

  const edit = (item: VideoItem) => {
    setEditing(item);
    setForm({ titulo: item.titulo, descricao: item.descricao || "", url_youtube: item.url_youtube, duracao: String(item.duracao), categoria_id: item.categoria_id || "", moedas: String((item as any).moedas ?? 0) });
    setDialogOpen(true);
  };

  // Category CRUD
  const saveCat = async () => {
    if (!catForm.nome) return;
    if (editingCat) {
      await supabase.from("video_categorias").update({ nome: catForm.nome }).eq("id", editingCat.id);
    } else {
      await supabase.from("video_categorias").insert({ nome: catForm.nome, ordem: categorias.length });
    }
    toast.success("Categoria salva!"); setCatDialogOpen(false); setEditingCat(null); setCatForm({ nome: "" }); load();
  };

  const removeCat = async (id: string) => {
    await supabase.from("video_categorias").delete().eq("id", id);
    toast.success("Categoria removida!"); load();
  };

  const getCatName = (id: string | null) => {
    if (!id) return "Sem categoria";
    return categorias.find(c => c.id === id)?.nome || "—";
  };

  return (
    <CrudSection title="Vídeos" count={items.length} onAdd={() => { setEditing(null); setForm({ titulo: "", descricao: "", url_youtube: "", duracao: "", categoria_id: "", moedas: "0" }); setDialogOpen(true); }}>
      {/* Categorias section */}
      <Card className="bg-secondary/30 border-border mb-4">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-mono text-sm">Categorias</CardTitle>
          <Button onClick={() => { setEditingCat(null); setCatForm({ nome: "" }); setCatDialogOpen(true); }} size="sm" variant="outline" className="gap-1">
            <Plus className="h-3 w-3" /> Nova Categoria
          </Button>
        </CardHeader>
        <CardContent>
          {categorias.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">Nenhuma categoria criada</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categorias.map((cat) => (
                <Badge key={cat.id} variant="secondary" className="text-sm py-1.5 px-3 gap-2">
                  {cat.nome}
                  <button onClick={() => { setEditingCat(cat); setCatForm({ nome: cat.nome }); setCatDialogOpen(true); }} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button onClick={() => removeCat(cat.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Videos table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Duração</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.ordem + 1}</TableCell>
              <TableCell className="font-mono text-sm">{item.titulo}</TableCell>
              <TableCell><Badge variant="outline" className="text-xs">{getCatName(item.categoria_id)}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.duracao}min</TableCell>
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

      {/* Video Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Novo"} Vídeo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título do vídeo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <Input placeholder="URL do YouTube (ex: https://youtube.com/watch?v=...)" value={form.url_youtube} onChange={(e) => handleUrlChange(e.target.value)} />
            <Input placeholder="Descrição (opcional)" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
              <SelectTrigger><SelectValue placeholder="Categoria (opcional)" /></SelectTrigger>
              <SelectContent>
                {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative">
              <Input placeholder="Duração (min)" type="number" value={form.duracao} onChange={(e) => setForm({ ...form, duracao: e.target.value })} disabled={fetchingDuration} />
              {fetchingDuration && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">Buscando...</span>}
            </div>
            <Input placeholder="Moedas ao assistir (0 = sem recompensa)" type="number" value={form.moedas} onChange={(e) => setForm({ ...form, moedas: e.target.value })} />
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editingCat ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Nome da categoria (ex: Aulas, Dicas, Revisão)" value={catForm.nome} onChange={(e) => setCatForm({ nome: e.target.value })} />
            <Button onClick={saveCat} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}
// ─── ADMIN CONFIG TAB ────────────────────────────────────
function AdminConfigTab() {
  const [nome, setNome] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("admin_config").select("*").eq("id", 1).single();
    if (data) {
      setNome(data.nome);
      setAvatarUrl(data.avatar_url);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveNome = async () => {
    if (!nome.trim()) return;
    await supabase.from("admin_config").update({ nome: nome.trim() }).eq("id", 1);
    toast.success("Nome atualizado!");
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Usuário não autenticado"); setUploading(false); return; }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/admin-avatar.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar foto");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();
    
    await supabase.from("admin_config").update({ avatar_url: url }).eq("id", 1);
    setAvatarUrl(url);
    setUploading(false);
    toast.success("Foto atualizada!");
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>;

  return (
    <Card className="bg-card border-border mt-4">
      <CardHeader>
        <CardTitle className="font-mono text-lg flex items-center gap-2">
          <User className="h-5 w-5 text-primary" /> Perfil do Admin
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Admin" className="h-16 w-16 rounded-full object-cover border-2 border-primary/30" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Foto de perfil</p>
            <p className="text-xs text-muted-foreground">Aparece no chat para os usuários</p>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-primary hover:underline">
              <Upload className="h-3 w-3" />
              {uploading ? "Enviando..." : "Alterar foto"}
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Nome do admin</p>
          <p className="text-xs text-muted-foreground">Esse nome aparece no chat</p>
          <div className="flex gap-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="max-w-xs" />
            <Button onClick={saveNome} size="sm">Salvar</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── BELINHA CONFIG TAB ───────────────────────────────────
function BelinhaConfigTab() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("");
  const [recado, setRecado] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("assistant_config")
        .select("system_prompt, model, avatar_url, recado")
        .eq("id", 1)
        .single();
      if (data) {
        setSystemPrompt(data.system_prompt);
        setModel(data.model);
        setRecado(data.recado || "");
        setAvatarUrl(data.avatar_url);
      }
      setLoading(false);
    };
    load();
  }, []);

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Faça login primeiro"); setUploading(false); return; }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/belinha-avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar foto");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();

    await supabase.from("assistant_config").update({ avatar_url: url }).eq("id", 1);
    setAvatarUrl(url);
    setUploading(false);
    toast.success("Foto da Belinha atualizada!");
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("assistant_config")
      .update({ system_prompt: systemPrompt, model, recado })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar configuração");
    } else {
      toast.success("Configuração da Belinha salva!");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>;

  return (
    <Card className="bg-card border-border mt-4">
      <CardHeader>
        <CardTitle className="font-mono text-lg flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> Configuração da Belinha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Belinha" className="h-16 w-16 rounded-full object-cover border-2 border-primary/30" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Foto de perfil da Belinha</p>
            <p className="text-xs text-muted-foreground">Aparece no chat como avatar da assistente</p>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-primary hover:underline">
              <Upload className="h-3 w-3" />
              {uploading ? "Enviando..." : "Alterar foto"}
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Modelo da IA</p>
          <p className="text-xs text-muted-foreground">Modelo usado no OpenRouter (ex: openai/gpt-4o-mini, google/gemini-2.0-flash-exp)</p>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="openai/gpt-4o-mini"
            className="max-w-md"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Recado</p>
          <p className="text-xs text-muted-foreground">
            Mensagem exibida no perfil da Belinha quando o usuário toca no nome dela.
          </p>
          <Textarea
            value={recado}
            onChange={(e) => setRecado(e.target.value)}
            rows={3}
            placeholder="Olá! Estou aqui para te ajudar nos estudos 💜"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Prompt do sistema</p>
          <p className="text-xs text-muted-foreground">
            Define a personalidade e o comportamento da Belinha. Seja específica sobre como ela deve responder.
          </p>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={10}
            placeholder="Você é a Belinha, uma assistente de estudos..."
          />
        </div>

        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? "Salvando..." : "Salvar configuração"}
        </Button>

        {/* Stories Section */}
        <BelinhaStoriesManager />
      </CardContent>
    </Card>
  );
}

// ─── BELINHA STORIES MANAGER ─────────────────────────────
function BelinhaStoriesManager() {
  const [stories, setStories] = useState<{ id: string; image_url: string; texto: string | null; tipo: string; created_at: string; expires_at: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [texto, setTexto] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("belinha_stories")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setStories(data as any);
  };

  useEffect(() => { load(); }, []);

  const uploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Faça login primeiro"); setUploading(false); return; }

    const isVideo = file.type.startsWith("video/");
    const tipo = isVideo ? "video" : "image";
    const ext = file.name.split(".").pop();
    const path = `${user.id}/story-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar arquivo");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase.from("belinha_stories").insert({
      image_url: urlData.publicUrl,
      texto: texto.trim() || null,
      tipo,
    });

    setTexto("");
    setUploading(false);
    toast.success("Story publicado!");
    load();
    e.target.value = "";
  };

  const remove = async (id: string) => {
    await supabase.from("belinha_stories").delete().eq("id", id);
    toast.success("Story removido!");
    load();
  };

  const isExpired = (expires_at: string) => new Date(expires_at) < new Date();

  return (
    <div className="space-y-4 border-t border-border pt-6">
      <div>
        <p className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> Stories da Belinha</p>
        <p className="text-xs text-muted-foreground">Publique imagens ou vídeos que desaparecem em 24h</p>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Texto do story (opcional)"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <div className="flex gap-2">
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
            <Image className="h-4 w-4" />
            {uploading ? "Enviando..." : "Imagem"}
            <input type="file" accept="image/*" className="hidden" onChange={uploadStory} disabled={uploading} />
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors">
            <Video className="h-4 w-4" />
            {uploading ? "Enviando..." : "Vídeo"}
            <input type="file" accept="video/*" className="hidden" onChange={uploadStory} disabled={uploading} />
          </label>
        </div>
      </div>

      {stories.length > 0 && (
        <div className="space-y-2">
          {stories.map((s) => (
            <div key={s.id} className={`flex items-center gap-3 p-2 rounded-lg border ${isExpired(s.expires_at) ? "opacity-50 border-border" : "border-primary/20"}`}>
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                {s.tipo === "video" ? (
                  <video src={s.image_url} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={s.image_url} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {s.tipo === "video" ? <Video className="h-3 w-3 text-muted-foreground" /> : <Image className="h-3 w-3 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground capitalize">{s.tipo}</span>
                  {isExpired(s.expires_at) && <Badge variant="outline" className="text-[10px] py-0">Expirado</Badge>}
                </div>
                {s.texto && <p className="text-sm truncate">{s.texto}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CERTIFICADOS TAB ──────────────────────────────────
function CertificadosTab() {
  const [minCreditos, setMinCreditos] = useState(100);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = async () => {
    const { data: config } = await supabase.from("certificado_config").select("creditos_minimos").eq("id", 1).single();
    if (config) setMinCreditos(config.creditos_minimos);

    const { data: sols } = await supabase
      .from("certificado_solicitacoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (sols) {
      // fetch profile names
      const userIds = [...new Set(sols.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, coins").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setSolicitacoes(sols.map((s: any) => ({ ...s, profile: profileMap.get(s.user_id) })));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveConfig = async () => {
    await supabase.from("certificado_config").update({ creditos_minimos: minCreditos }).eq("id", 1);
    toast.success("Configuração atualizada!");
  };

  const handleUploadCertificado = async (solicitacaoId: string, userId: string, cursoNome: string | null, file: File) => {
    setUploading(solicitacaoId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/certificado-${solicitacaoId}.${ext}`;
      await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase.from("certificado_solicitacoes").update({ status: "enviado", certificado_url: url }).eq("id", solicitacaoId);

      // Send notification to user
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", userId).single();
      await supabase.from("notificacoes").insert({
        tipo: "certificado_pronto",
        titulo: "Seu certificado está pronto! 🎉",
        mensagem: `O certificado${cursoNome ? ` do curso "${cursoNome}"` : ""} está disponível no seu perfil.`,
        link: "/perfil",
      });

      toast.success("Certificado enviado e usuário notificado!");
      load();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-mono text-base">Configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Créditos mínimos:</label>
            <Input
              type="number"
              value={minCreditos}
              onChange={(e) => setMinCreditos(Number(e.target.value))}
              className="w-28"
            />
            <Button onClick={saveConfig} size="sm">Salvar</Button>
          </div>
          <p className="text-xs text-muted-foreground">Quantidade de créditos necessários para solicitar o certificado.</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-mono text-base flex items-center gap-2">
            Solicitações <Badge variant="secondary">{solicitacoes.filter((s: any) => s.status === "pendente").length} pendentes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : solicitacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma solicitação ainda.</p>
          ) : (
            <div className="space-y-3">
              {solicitacoes.map((s: any) => (
                <div key={s.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${s.status === "pendente" ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                  <div>
                    <p className="text-sm font-mono font-medium">{s.profile?.display_name || "Desconhecido"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.curso_nome ? `Curso: ${s.curso_nome} • ` : ""}{new Date(s.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === "enviado" ? (
                      <Badge className="bg-primary/20 text-primary border-0">Enviado ✓</Badge>
                    ) : (
                      <label className="cursor-pointer">
                        <Button variant="outline" size="sm" className="gap-1.5" disabled={uploading === s.id} asChild>
                          <span>
                            {uploading === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                            Enviar certificado
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadCertificado(s.id, s.user_id, s.curso_nome, file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
