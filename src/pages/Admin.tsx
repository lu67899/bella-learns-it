import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import BackButton from "@/components/BackButton";
import { Shield, BookOpen, BrainCircuit, Plus, Edit2, Trash2, LogOut, Lock, MessageCircle, Send, GraduationCap, ArrowUp, ArrowDown, Trophy, Sparkles, Tag, Library, PlayCircle, User, Upload, Bot, Image, Video, Clock, ChevronLeft, Award, Loader2, Reply, Pencil, Check, X, Gamepad2, Wand2, Eye, Save, Headphones, Bell, Copy, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMaterias } from "@/hooks/useMaterias";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Types
interface Resumo { id: string; materia: string; titulo: string; conteudo: string; created_at: string; }

interface QuizQuestion { id: string; materia: string; pergunta: string; opcoes: string[]; correta: number; created_at: string; }
interface CronogramaItem { id: string; titulo: string; materia: string; dia_semana: number; horario: string; concluida: boolean; created_at: string; }
interface Anotacao { id: string; titulo: string; conteudo: string; materia: string | null; tags: string[] | null; created_at: string; }

const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

type AdminSection = 
  | "dashboard" | "cursos" | "modulos" | "materias" | "resumos" 
  | "quiz" | "forca" | "memoria" | "cruzadas" | "ordenar" | "videos" | "desafios" | "frases" 
  | "mensagens" | "perfil" | "belinha" | "certificados" | "resgates" | "gerador-ia" | "audiobooks" | "livros-pdf";

const adminSections = [
  {
    group: "📂 Conteúdo",
    items: [
      { key: "cursos" as AdminSection, label: "Cursos", icon: Library, desc: "Gerenciar cursos" },
      { key: "modulos" as AdminSection, label: "Módulos", icon: GraduationCap, desc: "Módulos e tópicos" },
      { key: "videos" as AdminSection, label: "Vídeos", icon: PlayCircle, desc: "Videoaulas e mix" },
      { key: "audiobooks" as AdminSection, label: "Audiobooks", icon: Headphones, desc: "Gerenciar audiobooks" },
      { key: "livros-pdf" as AdminSection, label: "Livros PDF", icon: BookOpen, desc: "Gerenciar livros PDF" },
    ],
  },
  {
    group: "📚 Estudo",
    items: [
      { key: "materias" as AdminSection, label: "Matérias", icon: Tag, desc: "Categorias de matérias" },
      { key: "resumos" as AdminSection, label: "Resumos", icon: BookOpen, desc: "Resumos de conteúdo" },
      { key: "quiz" as AdminSection, label: "Quiz", icon: BrainCircuit, desc: "Questões de quiz" },
      { key: "forca" as AdminSection, label: "Forca", icon: Gamepad2, desc: "Palavras do jogo da forca" },
      { key: "memoria" as AdminSection, label: "Memória", icon: BrainCircuit, desc: "Pares do jogo da memória" },
      { key: "cruzadas" as AdminSection, label: "Cruzadas", icon: Gamepad2, desc: "Palavras cruzadas" },
      { key: "ordenar" as AdminSection, label: "Ordenar", icon: Gamepad2, desc: "Ordene os passos" },
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
    group: "🤖 Inteligência Artificial",
    items: [
      { key: "gerador-ia" as AdminSection, label: "Gerar Conteúdo", icon: Wand2, desc: "Criar cursos e tópicos com IA" },
      { key: "belinha" as AdminSection, label: "Bellinha IA", icon: Bot, desc: "Assistente e stories" },
    ],
  },
  {
    group: "⚙️ Configurações",
    items: [
      { key: "certificados" as AdminSection, label: "Certificados", icon: Award, desc: "Solicitações e config" },
      { key: "resgates" as AdminSection, label: "Resgates", icon: Award, desc: "Solicitações de resgate PIX" },
      { key: "perfil" as AdminSection, label: "Perfil Admin", icon: User, desc: "Nome e foto do admin" },
    ],
  },
];

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [updateNotifOpen, setUpdateNotifOpen] = useState(false);
  const [updateNotifTitle, setUpdateNotifTitle] = useState("Atualização disponível! 🚀");
  const [updateNotifMsg, setUpdateNotifMsg] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);

  const sendUpdateNotification = async () => {
    if (!updateNotifTitle.trim()) return;
    setSendingNotif(true);
    try {
      await supabase.from("notificacoes").insert({
        tipo: "atualizacao",
        titulo: updateNotifTitle.trim(),
        mensagem: updateNotifMsg.trim() || null,
      });
      toast.success("Notificação de atualização enviada!");
      setUpdateNotifOpen(false);
      setUpdateNotifTitle("Atualização disponível! 🚀");
      setUpdateNotifMsg("");
    } catch {
      toast.error("Erro ao enviar notificação");
    } finally {
      setSendingNotif(false);
    }
  };

  // Fetch notification toggle state
  useEffect(() => {
    const fetchNotifState = async () => {
      const { data } = await supabase.from("app_features").select("notifications_enabled").limit(1).single();
      if (data) setNotificationsEnabled(data.notifications_enabled);
    };
    fetchNotifState();
  }, []);

  const toggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    await supabase.from("app_features").update({ notifications_enabled: enabled }).eq("id", 1);
    toast.success(enabled ? "Notificações automáticas ativadas" : "Notificações automáticas pausadas");
  };

  const sendCourseNotification = async (cursoId: string, cursoNome: string) => {
    await supabase.from("notificacoes").insert({
      tipo: "novo_conteudo",
      titulo: "Novo curso disponível!",
      mensagem: `O curso "${cursoNome}" foi adicionado com todos os módulos e tópicos.`,
      link: `/curso/${cursoId}`,
    });
    toast.success("Notificação enviada para os alunos!");
  };

  // Check admin role
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    const checkRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkRole();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchCounts = async () => {
      const [msgRes, certRes, resRes] = await Promise.all([
        supabase.from("mensagens").select("id", { count: "exact", head: true }).eq("remetente", "aluno").eq("lida", false),
        supabase.from("certificado_solicitacoes").select("id", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("resgate_solicitacoes").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      ]);
      setPendingCounts({
        mensagens: msgRes.count || 0,
        certificados: certRes.count || 0,
        resgates: resRes.count || 0,
      });
    };
    fetchCounts();
  }, [isAdmin, activeSection]);

  if (authLoading || isAdmin === null) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-sm mx-auto mt-20 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-destructive/20">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-mono font-bold">Acesso Negado</h1>
            <p className="text-sm text-muted-foreground">Sua conta não tem permissão de administrador.</p>
          </motion.div>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar ao início
            </Button>
          </div>
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
      
      case "quiz": return <QuizTab />;
      case "forca": return <ForcaTab />;
      case "memoria": return <MemoriaTab />;
      case "cruzadas": return <CruzadasTab />;
      case "ordenar": return <OrdenarTab />;
      case "videos": return <VideosTab />;
      case "desafios": return <DesafiosTab />;
      case "frases": return <FrasesTab />;
      case "mensagens": return <MensagensTab />;
      case "perfil": return <AdminConfigTab />;
      case "belinha": return <BelinhaConfigTab />;
      case "certificados": return <CertificadosTab />;
      case "resgates": return <ResgatesTab />;
      case "gerador-ia": return <GeradorIATab />;
      case "audiobooks": return <AudiobooksTab />;
      case "livros-pdf": return <LivrosPdfTab />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-5 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            {activeSection !== "dashboard" ? (
              <BackButton onClick={() => setActiveSection("dashboard")} label="Dashboard" />
            ) : (
              <BackButton to="/" />
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
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-xs">
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
              {/* Notification Toggle */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium font-mono">Notificações Automáticas</p>
                      <p className="text-[11px] text-muted-foreground">
                        {notificationsEnabled ? "Cada novo conteúdo gera notificação" : "Pausadas — ideal para cadastrar em lote"}
                      </p>
                    </div>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={toggleNotifications} />
                </CardContent>
              </Card>

              {/* Send Update Notification */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Send className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium font-mono">Notificar Atualização</p>
                      <p className="text-[11px] text-muted-foreground">Enviar aviso de update do app</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setUpdateNotifOpen(true)} className="gap-1.5 text-xs">
                    <Send className="h-3 w-3" /> Enviar
                  </Button>
                </CardContent>
              </Card>

              <Dialog open={updateNotifOpen} onOpenChange={setUpdateNotifOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Notificação de Atualização</DialogTitle>
                    <DialogDescription>Todos os usuários receberão essa notificação.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Título</label>
                      <Input value={updateNotifTitle} onChange={e => setUpdateNotifTitle(e.target.value)} placeholder="Ex: Atualização disponível! 🚀" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Mensagem (opcional)</label>
                      <Textarea value={updateNotifMsg} onChange={e => setUpdateNotifMsg(e.target.value)} placeholder="Descreva as novidades..." rows={3} />
                    </div>
                    <Button onClick={sendUpdateNotification} disabled={sendingNotif || !updateNotifTitle.trim()} className="w-full gap-2">
                      {sendingNotif ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Enviar Notificação
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {adminSections.map((group) => (
                <div key={group.group} className="space-y-2.5">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider px-1"><span className="emoji-fix mr-1">{group.group.split(" ")[0]}</span>{group.group.split(" ").slice(1).join(" ")}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const badgeCount = item.key === "mensagens" ? pendingCounts.mensagens : item.key === "certificados" ? pendingCounts.certificados : item.key === "resgates" ? pendingCounts.resgates : 0;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setActiveSection(item.key)}
                          className="relative flex flex-col items-start gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                        >
                          {badgeCount > 0 && (
                            <span className="absolute top-2 right-2 flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold font-mono animate-pulse">
                              {badgeCount}
                            </span>
                          )}
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
  const [items, setItems] = useState<{ id: string; nome: string; descricao: string | null; assunto: string | null; tempo_estimado: string | null; moedas_total: number; ordem: number }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", assunto: "", tempo_estimado: "", moedas_total: "0" });

  const load = async () => {
    const { data } = await supabase.from("cursos").select("*").order("ordem");
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.nome) return;
    const payload = { nome: form.nome, descricao: form.descricao || null, assunto: form.assunto || null, tempo_estimado: form.tempo_estimado || null, moedas_total: parseInt(form.moedas_total) || 0, ordem: editing ? editing.ordem : items.length };
    if (editing) {
      await supabase.from("cursos").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("cursos").insert(payload);
    }
    toast.success("Curso salvo!"); setDialogOpen(false); setEditing(null); setForm({ nome: "", descricao: "", assunto: "", tempo_estimado: "", moedas_total: "0" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("cursos").delete().eq("id", id);
    toast.success("Curso removido!"); load();
  };

  const removeAll = async () => {
    const ids = items.map(i => i.id);
    if (ids.length === 0) return;
    await supabase.from("cursos").delete().in("id", ids);
    toast.success("Todos os cursos foram removidos!"); load();
  };

  const notifyCourse = async (id: string, nome: string) => {
    await supabase.from("notificacoes").insert({
      tipo: "novo_conteudo",
      titulo: "Novo curso disponível!",
      mensagem: `O curso "${nome}" foi adicionado com todos os módulos e tópicos.`,
      link: `/curso/${id}`,
    });
    toast.success("Notificação enviada!");
  };

  return (
    <CrudSection title="Cursos" count={items.length} onAdd={() => { setEditing(null); setForm({ nome: "", descricao: "", assunto: "", tempo_estimado: "", moedas_total: "0" }); setDialogOpen(true); }}
      onRemoveAll={items.length > 0 ? removeAll : undefined}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead>Tempo</TableHead>
            <TableHead>Moedas</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.ordem + 1}</TableCell>
              <TableCell className="font-mono text-sm">{item.nome}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.assunto || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.tempo_estimado || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.moedas_total || "—"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" title="Notificar alunos" onClick={() => notifyCourse(item.id, item.nome)}>
                    <Bell className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setForm({ nome: item.nome, descricao: item.descricao || "", assunto: item.assunto || "", tempo_estimado: item.tempo_estimado || "", moedas_total: String(item.moedas_total || 0) }); setDialogOpen(true); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                   <ConfirmDeleteButton onConfirm={() => remove(item.id)} />
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
            <Input placeholder="Assunto abordado (ex: Programação Web)" value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} />
            <Input placeholder="Tempo estimado (ex: 40 horas)" value={form.tempo_estimado} onChange={(e) => setForm({ ...form, tempo_estimado: e.target.value })} />
            <Input type="number" placeholder="Total de moedas do curso (ex: 100)" value={form.moedas_total} onChange={(e) => setForm({ ...form, moedas_total: e.target.value })} />
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
             <AlertDialog>
               <AlertDialogTrigger asChild>
                 <button className="text-destructive hover:text-destructive/80 transition-colors"><Trash2 className="h-3 w-3" /></button>
               </AlertDialogTrigger>
               <AlertDialogContent className="max-w-[280px] rounded-2xl">
                 <AlertDialogHeader>
                   <AlertDialogTitle className="text-sm font-mono">Remover matéria</AlertDialogTitle>
                   <AlertDialogDescription className="text-xs">Deseja remover "{m}"?</AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel className="text-xs h-8">Cancelar</AlertDialogCancel>
                   <AlertDialogAction className="text-xs h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remove(m)}>Excluir</AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>
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
                   <ConfirmDeleteButton onConfirm={() => remove(item.id)} />
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
        link: "/quiz",
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
              <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => edit(item)}><Edit2 className="h-3 w-3" /></Button><ConfirmDeleteButton onConfirm={() => remove(item.id)} /></div></TableCell>
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
                   <ConfirmDeleteButton onConfirm={() => remove(item.id)} />
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
                    <p className="text-xs text-foreground mt-1 flex items-center gap-1.5">PIX: <span className="font-mono">{s.chave_pix}</span>
                      <button onClick={() => { navigator.clipboard.writeText(s.chave_pix); toast.success("Chave PIX copiada!"); }} className="text-primary hover:text-primary/80 transition-colors" title="Copiar chave PIX"><Copy className="h-3 w-3" /></button>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.status === "pago" ? (
                      <Badge className="bg-primary/20 text-primary border-0">Pago ✓</Badge>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            Marcar como pago
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[280px] rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-sm font-mono">Confirmar pagamento</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs">Deseja marcar este resgate de {s.valor_moedas} moedas como pago?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-xs h-8">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="text-xs h-8" onClick={() => markAsPaid(s.id)}>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
                     <ConfirmDeleteButton onConfirm={() => removeModulo(mod.id)} />
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
                             <ConfirmDeleteButton onConfirm={() => removeTopico(t.id)} />
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
                   <ConfirmDeleteButton onConfirm={() => remove(item.id)} />
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
                   <AlertDialog>
                     <AlertDialogTrigger asChild>
                       <button className="text-destructive hover:text-destructive/80 transition-colors"><Trash2 className="h-3 w-3" /></button>
                     </AlertDialogTrigger>
                     <AlertDialogContent className="max-w-[280px] rounded-2xl">
                       <AlertDialogHeader>
                         <AlertDialogTitle className="text-sm font-mono">Remover categoria</AlertDialogTitle>
                         <AlertDialogDescription className="text-xs">Deseja remover esta categoria?</AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter>
                         <AlertDialogCancel className="text-xs h-8">Cancelar</AlertDialogCancel>
                         <AlertDialogAction className="text-xs h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => removeCat(cat.id)}>Excluir</AlertDialogAction>
                       </AlertDialogFooter>
                     </AlertDialogContent>
                   </AlertDialog>
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
                  <ConfirmDeleteButton onConfirm={() => remove(item.id)} />
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [nomeApp, setNomeApp] = useState("Bella Space");
  const [subtitulo, setSubtitulo] = useState("Plataforma de estudos");
  const [codigoAuth, setCodigoAuth] = useState("");
  const [weatherApiKey, setWeatherApiKey] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("admin_config").select("*").eq("id", 1).single();
    if (data) {
      setNome(data.nome);
      setAvatarUrl(data.avatar_url);
      setLogoUrl((data as any).logo_url);
      setNomeApp((data as any).nome_app || "Bella Space");
      setSubtitulo((data as any).subtitulo || "Plataforma de estudos");
      setCodigoAuth((data as any).codigo_autorizacao || "");
      setWeatherApiKey((data as any).weather_api_key || "");
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

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Usuário não autenticado"); setUploadingLogo(false); return; }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/app-logo.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar logo");
      setUploadingLogo(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();
    
    await supabase.from("admin_config").update({ logo_url: url } as any).eq("id", 1);
    setLogoUrl(url);
    setUploadingLogo(false);
    toast.success("Logo atualizado!");
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
        {/* Logo do App */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-cover border-2 border-primary/30" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center border-2 border-border">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Logo do App</p>
            <p className="text-xs text-muted-foreground">Aparece na tela de login</p>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-primary hover:underline">
              <Upload className="h-3 w-3" />
              {uploadingLogo ? "Enviando..." : "Alterar logo"}
              <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={uploadingLogo} />
            </label>
          </div>
        </div>

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

        {/* Nome do Admin */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Nome do admin</p>
          <p className="text-xs text-muted-foreground">Esse nome aparece no chat</p>
          <div className="flex gap-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="max-w-xs" />
            <Button onClick={saveNome} size="sm">Salvar</Button>
          </div>
        </div>

        {/* Nome do App */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Nome do app</p>
          <p className="text-xs text-muted-foreground">Aparece no menu lateral e na tela de login</p>
          <div className="flex gap-2">
            <Input value={nomeApp} onChange={(e) => setNomeApp(e.target.value)} placeholder="Nome do app" className="max-w-xs" />
            <Button onClick={async () => {
              if (!nomeApp.trim()) return;
              await supabase.from("admin_config").update({ nome_app: nomeApp.trim() } as any).eq("id", 1);
              toast.success("Nome do app atualizado!");
            }} size="sm">Salvar</Button>
          </div>
        </div>

        {/* Subtítulo */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Subtítulo / Frase</p>
          <p className="text-xs text-muted-foreground">Frase abaixo do nome do app (menu e login)</p>
          <div className="flex gap-2">
            <Input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Ex: Plataforma de estudos" className="max-w-xs" />
            <Button onClick={async () => {
              if (!subtitulo.trim()) return;
              await supabase.from("admin_config").update({ subtitulo: subtitulo.trim() } as any).eq("id", 1);
              toast.success("Subtítulo atualizado!");
            }} size="sm">Salvar</Button>
          </div>
        </div>

        {/* Código de Autorização */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Código de autorização</p>
          <p className="text-xs text-muted-foreground">Se preenchido, será exigido no cadastro de novos usuários</p>
          <div className="flex gap-2">
            <Input value={codigoAuth} onChange={(e) => setCodigoAuth(e.target.value)} placeholder="Deixe vazio para desativar" className="max-w-xs" />
            <Button onClick={async () => {
              await supabase.from("admin_config").update({ codigo_autorizacao: codigoAuth.trim() || null } as any).eq("id", 1);
              toast.success("Código de autorização atualizado!");
            }} size="sm">Salvar</Button>
          </div>
        </div>

        {/* Weather API Key */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Chave da API de clima</p>
          <p className="text-xs text-muted-foreground">OpenWeatherMap API Key para o widget de clima</p>
          <div className="flex gap-2">
            <Input value={weatherApiKey} onChange={(e) => setWeatherApiKey(e.target.value)} placeholder="Cole a API key aqui" className="max-w-xs" type="password" />
            <Button onClick={async () => {
              await supabase.from("admin_config").update({ weather_api_key: weatherApiKey.trim() || null } as any).eq("id", 1);
              toast.success("API key de clima atualizada!");
            }} size="sm">Salvar</Button>
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
  const [provider, setProvider] = useState<"openrouter" | "lovable">("openrouter");
  const [recado, setRecado] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [configRes, keysRes] = await Promise.all([
        supabase.from("assistant_config").select("system_prompt, model, avatar_url, recado, provider").eq("id", 1).single(),
        supabase.from("api_keys_config").select("openrouter_api_key").eq("id", 1).single(),
      ]);
      if (configRes.data) {
        setSystemPrompt(configRes.data.system_prompt);
        setModel(configRes.data.model);
        setProvider((configRes.data as any).provider || "openrouter");
        setRecado(configRes.data.recado || "");
        setAvatarUrl(configRes.data.avatar_url);
      }
      if (keysRes.data) {
        setOpenrouterKey((keysRes.data as any).openrouter_api_key || "");
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
    toast.success("Foto da Bellinha atualizada!");
  };

  const save = async () => {
    setSaving(true);
    const [configRes, keysRes] = await Promise.all([
      supabase.from("assistant_config").update({ system_prompt: systemPrompt, model, recado, provider } as any).eq("id", 1),
      supabase.from("api_keys_config").update({ openrouter_api_key: openrouterKey } as any).eq("id", 1),
    ]);
    setSaving(false);
    if (configRes.error || keysRes.error) {
      toast.error("Erro ao salvar configuração");
    } else {
      toast.success("Configuração da Bellinha salva!");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>;

  return (
    <Card className="bg-card border-border mt-4">
      <CardHeader>
        <CardTitle className="font-mono text-lg flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" /> Configuração da Bellinha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Bellinha" className="h-16 w-16 rounded-full object-cover border-2 border-primary/30" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Foto de perfil da Bellinha</p>
            <p className="text-xs text-muted-foreground">Aparece no chat como avatar da assistente</p>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-primary hover:underline">
              <Upload className="h-3 w-3" />
              {uploading ? "Enviando..." : "Alterar foto"}
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Provider selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Provedor de IA</p>
          <div className="flex gap-2 max-w-md">
            <Button
              type="button"
              variant={provider === "lovable" ? "default" : "outline"}
              size="sm"
              className="flex-1 font-mono text-xs"
              onClick={() => {
                setProvider("lovable");
                if (!model || model.startsWith("openai/gpt-4o") || model.startsWith("deepseek/") || model.startsWith("anthropic/")) {
                  setModel("google/gemini-3-flash-preview");
                }
              }}
            >
              ✨ Lovable AI
            </Button>
            <Button
              type="button"
              variant={provider === "openrouter" ? "default" : "outline"}
              size="sm"
              className="flex-1 font-mono text-xs"
              onClick={() => {
                setProvider("openrouter");
                if (!model || model.startsWith("google/gemini-3")) {
                  setModel("openai/gpt-4o-mini");
                }
              }}
            >
              🔀 OpenRouter
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {provider === "lovable" ? "Créditos incluídos no Lovable — sem custo extra" : "Requer créditos no openrouter.ai"}
          </p>
        </div>

        {/* OpenRouter API Key */}
        {provider === "openrouter" && (
          <div className="space-y-2">
            <p className="text-sm font-medium">🔑 Chave da API OpenRouter</p>
            <p className="text-xs text-muted-foreground">
              Cole sua chave do openrouter.ai aqui. Será salva de forma segura (apenas admins podem ver).
            </p>
            <div className="flex gap-2 max-w-md">
              <Input
                type={showKey ? "text" : "password"}
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="flex-1 font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? "🙈" : "👁️"}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Modelo da IA</p>
          <p className="text-xs text-muted-foreground">
            {provider === "lovable" 
              ? "Selecione ou digite um modelo do Lovable AI Gateway" 
              : "Selecione ou digite um modelo do OpenRouter"}
          </p>
          {(() => {
            const lovableModels = [
              "google/gemini-3-flash-preview",
              "google/gemini-2.5-flash",
              "openai/gpt-5-mini",
              "anthropic/claude-sonnet-4",
            ];
            const openrouterModels = [
              "openai/gpt-4o-mini",
              "openai/gpt-4o",
              "google/gemini-2.0-flash-exp",
              "google/gemini-2.5-flash-preview-05-20",
              "anthropic/claude-sonnet-4",
              "deepseek/deepseek-chat-v3-0324",
              "meta-llama/llama-4-maverick",
            ];
            const models = provider === "lovable" ? lovableModels : openrouterModels;
            const isCustom = model && !models.includes(model);
            return (
              <div className="flex flex-col gap-2 max-w-md">
                <Select
                  value={isCustom ? "__custom__" : model}
                  onValueChange={(v) => {
                    if (v === "__custom__") {
                      setModel("");
                    } else {
                      setModel(v);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m} value={m}>
                        <span className="font-mono text-xs">{m}</span>
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">
                      <span className="text-xs">✏️ Digitar outro modelo</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {(isCustom || model === "") && (
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={provider === "lovable" ? "google/gemini-3-flash-preview" : "openai/gpt-4o-mini"}
                  />
                )}
              </div>
            );
          })()}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Recado</p>
          <p className="text-xs text-muted-foreground">
            Mensagem exibida no perfil da Bellinha quando o usuário toca no nome dela.
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
            Define a personalidade e o comportamento da Bellinha. Seja específica sobre como ela deve responder.
          </p>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={10}
            placeholder="Você é a Bellinha, uma assistente de estudos..."
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
        <p className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> Stories da Bellinha</p>
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
               <ConfirmDeleteButton onConfirm={() => remove(s.id)} />
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

// ─── FORCA TAB ─────────────────────────────────────────
function ForcaTab() {
  const [items, setItems] = useState<{ id: string; palavra: string; dica: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ palavra: "", dica: "" });

  const load = async () => {
    const { data } = await supabase.from("forca_palavras").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.palavra.trim() || !form.dica.trim()) return;
    const payload = { palavra: form.palavra.trim().toUpperCase(), dica: form.dica.trim() };
    if (editing) {
      await supabase.from("forca_palavras").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("forca_palavras").insert(payload);
    }
    toast.success("Palavra salva!"); setDialogOpen(false); setEditing(null); setForm({ palavra: "", dica: "" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("forca_palavras").delete().eq("id", id);
    toast.success("Palavra removida!"); load();
  };

  return (
    <CrudSection title="Palavras da Forca" count={items.length} onAdd={() => { setEditing(null); setForm({ palavra: "", dica: "" }); setDialogOpen(true); }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Palavra</TableHead>
            <TableHead>Dica</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm font-bold">{item.palavra}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.dica}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setForm({ palavra: item.palavra, dica: item.dica }); setDialogOpen(true); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                   <ConfirmDeleteButton onConfirm={() => remove(item.id)} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma palavra cadastrada.</p>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Nova"} Palavra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Palavra (ex: ALGORITMO)" value={form.palavra} onChange={(e) => setForm({ ...form, palavra: e.target.value })} />
            <Input placeholder="Dica (ex: Sequência de passos para resolver um problema)" value={form.dica} onChange={(e) => setForm({ ...form, dica: e.target.value })} />
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}
// ─── MEMÓRIA TAB ─────────────────────────────────────────
function MemoriaTab() {
  const [items, setItems] = useState<{ id: string; termo: string; definicao: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ termo: "", definicao: "" });

  const load = async () => {
    const { data } = await supabase.from("memoria_pares").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.termo.trim() || !form.definicao.trim()) return;
    const payload = { termo: form.termo.trim(), definicao: form.definicao.trim() };
    if (editing) {
      await supabase.from("memoria_pares").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("memoria_pares").insert(payload);
    }
    toast.success("Par salvo!"); setDialogOpen(false); setEditing(null); setForm({ termo: "", definicao: "" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("memoria_pares").delete().eq("id", id);
    toast.success("Par removido!"); load();
  };

  return (
    <CrudSection title="Pares da Memória" count={items.length} onAdd={() => { setEditing(null); setForm({ termo: "", definicao: "" }); setDialogOpen(true); }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Termo</TableHead>
            <TableHead>Definição</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm font-bold">{item.termo}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.definicao}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setForm({ termo: item.termo, definicao: item.definicao }); setDialogOpen(true); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                   <ConfirmDeleteButton onConfirm={() => remove(item.id)} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum par cadastrado.</p>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Novo"} Par</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Termo (ex: Algoritmo)" value={form.termo} onChange={(e) => setForm({ ...form, termo: e.target.value })} />
            <Input placeholder="Definição (ex: Sequência lógica de passos)" value={form.definicao} onChange={(e) => setForm({ ...form, definicao: e.target.value })} />
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}

// ─── CRUZADAS TAB ─────────────────────────────────────────
function CruzadasTab() {
  const [items, setItems] = useState<{ id: string; palavra: string; dica: string }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ palavra: "", dica: "" });

  const load = async () => {
    const { data } = await supabase.from("cruzadas_palavras").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.palavra.trim() || !form.dica.trim()) return;
    const payload = { palavra: form.palavra.trim().toUpperCase(), dica: form.dica.trim() };
    if (editing) {
      await supabase.from("cruzadas_palavras").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("cruzadas_palavras").insert(payload);
    }
    toast.success("Palavra salva!"); setDialogOpen(false); setEditing(null); setForm({ palavra: "", dica: "" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("cruzadas_palavras").delete().eq("id", id);
    toast.success("Palavra removida!"); load();
  };

  return (
    <CrudSection title="Palavras Cruzadas" count={items.length} onAdd={() => { setEditing(null); setForm({ palavra: "", dica: "" }); setDialogOpen(true); }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Palavra</TableHead>
            <TableHead>Dica</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm font-bold">{item.palavra}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.dica}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setForm({ palavra: item.palavra, dica: item.dica }); setDialogOpen(true); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                   <ConfirmDeleteButton onConfirm={() => remove(item.id)} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma palavra cadastrada.</p>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Nova"} Palavra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Palavra (ex: ALGORITMO)" value={form.palavra} onChange={(e) => setForm({ ...form, palavra: e.target.value })} />
            <Input placeholder="Dica (ex: Sequência de passos para resolver um problema)" value={form.dica} onChange={(e) => setForm({ ...form, dica: e.target.value })} />
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}

// ─── ORDENAR TAB ─────────────────────────────────────────
function OrdenarTab() {
  const [items, setItems] = useState<{ id: string; titulo: string; passos: string[] }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ titulo: "", passos: ["", "", ""] });

  const load = async () => {
    const { data } = await supabase.from("ordenar_passos").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const passosLimpos = form.passos.filter(p => p.trim() !== "");
    if (!form.titulo.trim() || passosLimpos.length < 2) { toast.error("Título e pelo menos 2 passos são necessários."); return; }
    const payload = { titulo: form.titulo.trim(), passos: passosLimpos.map(p => p.trim()) };
    if (editing) {
      await supabase.from("ordenar_passos").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("ordenar_passos").insert(payload);
    }
    toast.success("Desafio salvo!"); setDialogOpen(false); setEditing(null); setForm({ titulo: "", passos: ["", "", ""] }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("ordenar_passos").delete().eq("id", id);
    toast.success("Desafio removido!"); load();
  };

  const updatePasso = (index: number, value: string) => {
    const newPassos = [...form.passos];
    newPassos[index] = value;
    setForm({ ...form, passos: newPassos });
  };

  const addPasso = () => setForm({ ...form, passos: [...form.passos, ""] });
  const removePasso = (index: number) => {
    if (form.passos.length <= 2) return;
    setForm({ ...form, passos: form.passos.filter((_, i) => i !== index) });
  };

  return (
    <CrudSection title="Ordene os Passos" count={items.length} onAdd={() => { setEditing(null); setForm({ titulo: "", passos: ["", "", ""] }); setDialogOpen(true); }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Passos</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm font-bold">{item.titulo}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.passos.length} etapas</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setForm({ titulo: item.titulo, passos: [...item.passos] }); setDialogOpen(true); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                   <ConfirmDeleteButton onConfirm={() => remove(item.id)} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum desafio cadastrado.</p>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Novo"} Desafio</DialogTitle></DialogHeader>
          <DialogDescription className="text-xs text-muted-foreground">
            Cadastre os passos na ordem correta. O jogo vai embaralhar automaticamente.
          </DialogDescription>
          <div className="space-y-3">
            <Input placeholder="Título (ex: Ciclo de Vida do Software)" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">Passos (na ordem correta):</p>
              {form.passos.map((passo, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                  <Input
                    placeholder={`Passo ${i + 1}`}
                    value={passo}
                    onChange={(e) => updatePasso(i, e.target.value)}
                    className="flex-1"
                  />
                  {form.passos.length > 2 && (
                    <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removePasso(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full gap-1" onClick={addPasso}>
                <Plus className="h-3 w-3" /> Adicionar passo
              </Button>
            </div>
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}



// ─── GERADOR IA TAB ─────────────────────────────────────────
function GeradorIATab() {
  const [cursos, setCursos] = useState<{ id: string; nome: string; descricao: string | null }[]>([]);
  const [selectedCurso, setSelectedCurso] = useState<string>("");
  const [aiProvider, setAiProvider] = useState<"openrouter" | "lovable">("openrouter");
  const [selectedModel, setSelectedModel] = useState<string>("openai/gpt-4o-mini");
  const [customModel, setCustomModel] = useState<string>("");
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [inserting, setInserting] = useState(false);
  const [generated, setGenerated] = useState<any>(null);
  const [contextInfo, setContextInfo] = useState<string>("");

  const openrouterModels = [
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (Padrão)", desc: "Rápido e barato" },
    { value: "openai/gpt-4o", label: "GPT-4o", desc: "Alta qualidade" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Equilibrado" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Máxima qualidade" },
    { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", desc: "Excelente raciocínio" },
    { value: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3", desc: "Custo muito baixo" },
  ];

  const lovableModels = [
    { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Padrão)", desc: "Rápido e eficiente" },
    { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", desc: "Máxima qualidade" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Equilibrado" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Alta qualidade" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini", desc: "Rápido e poderoso" },
    { value: "openai/gpt-5", label: "GPT-5", desc: "Máximo poder" },
  ];

  const aiModels = aiProvider === "lovable" ? lovableModels : openrouterModels;

  useEffect(() => {
    loadCursos();
  }, []);

  const loadCursos = async () => {
    const { data } = await supabase.from("cursos").select("id, nome, descricao").order("ordem");
    if (data) setCursos(data);
  };

  const loadContext = async (cursoId: string) => {
    if (!cursoId || cursoId === "novo") {
      setContextInfo("Será criado um novo curso.");
      return;
    }
    const curso = cursos.find(c => c.id === cursoId);
    const { data: modulos } = await supabase.from("modulos").select("id, nome, ordem").eq("curso_id", cursoId).order("ordem");
    let topicCount = 0;
    if (modulos && modulos.length > 0) {
      const { count } = await supabase.from("modulo_topicos").select("*", { count: "exact", head: true }).in("modulo_id", modulos.map(m => m.id));
      topicCount = count || 0;
    }
    setContextInfo(`Curso: "${curso?.nome}" — ${modulos?.length || 0} módulos, ${topicCount} tópicos existentes.`);
  };

  useEffect(() => {
    if (selectedCurso) loadContext(selectedCurso);
  }, [selectedCurso]);

  const generate = async () => {
    if (!prompt.trim()) { toast.error("Digite um prompt!"); return; }
    setLoading(true);
    setGenerated(null);
    try {
      const res = await supabase.functions.invoke("generate-content", {
        body: {
          action: "generate",
          prompt: prompt.trim(),
          curso_id: selectedCurso === "novo" ? null : selectedCurso || null,
          model: aiProvider === "openrouter" && useCustomModel && customModel.trim() ? customModel.trim() : selectedModel,
          provider: aiProvider,
        },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data;
      if (data.error) { toast.error(data.error); return; }
      setGenerated(data.generated);
      toast.success("Conteúdo gerado! Revise abaixo antes de salvar.");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao gerar conteúdo");
    } finally {
      setLoading(false);
    }
  };

  const insertContent = async () => {
    if (!generated) return;
    setInserting(true);
    try {
      const res = await supabase.functions.invoke("generate-content", {
        body: {
          action: "insert",
          generated,
          curso_id: selectedCurso === "novo" ? null : selectedCurso || null,
          prompt: JSON.stringify(generated),
        },
      });
      if (res.error) throw new Error(res.error.message);
      const data = res.data;
      if (data.error) { toast.error(data.error); return; }
      toast.success("Conteúdo inserido no banco de dados com sucesso! 🎉");
      setGenerated(null);
      setPrompt("");
      loadCursos();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao inserir conteúdo");
    } finally {
      setInserting(false);
    }
  };

  const totalTopicos = generated?.modulos?.reduce((acc: number, m: any) => acc + (m.topicos?.length || 0), 0) || 0;

  return (
    <div className="space-y-4 mt-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Gerador de Conteúdo com IA
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            A IA analisa o conteúdo existente no banco de dados antes de gerar. Você pode criar novos cursos ou expandir existentes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Curso selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-mono font-medium">Curso destino</label>
            <Select value={selectedCurso} onValueChange={setSelectedCurso}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um curso existente ou crie novo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">➕ Criar novo curso</SelectItem>
                {cursos.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {contextInfo && (
              <p className="text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <Eye className="h-3 w-3 shrink-0" /> {contextInfo}
              </p>
            )}
          </div>

          {/* Provider selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-mono font-medium">Provedor de IA</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={aiProvider === "lovable" ? "default" : "outline"}
                size="sm"
                className="flex-1 font-mono text-xs"
                onClick={() => {
                  setAiProvider("lovable");
                  setSelectedModel("google/gemini-3-flash-preview");
                  setUseCustomModel(false);
                }}
              >
                ✨ Lovable AI
              </Button>
              <Button
                type="button"
                variant={aiProvider === "openrouter" ? "default" : "outline"}
                size="sm"
                className="flex-1 font-mono text-xs"
                onClick={() => {
                  setAiProvider("openrouter");
                  setSelectedModel("openai/gpt-4o-mini");
                }}
              >
                🔀 OpenRouter
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {aiProvider === "lovable" ? "Créditos incluídos no Lovable — sem custo extra" : "Requer créditos no openrouter.ai"}
            </p>
          </div>

          {/* Model selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-mono font-medium">Modelo de IA</label>
              {aiProvider === "openrouter" && (
                <button
                  type="button"
                  onClick={() => setUseCustomModel(!useCustomModel)}
                  className="text-[11px] text-primary hover:underline font-mono"
                >
                  {useCustomModel ? "← Usar lista" : "Digitar modelo"}
                </button>
              )}
            </div>
            {aiProvider === "openrouter" && useCustomModel ? (
              <div className="space-y-1">
                <Input
                  placeholder="Ex: anthropic/claude-sonnet-4, meta-llama/llama-4-scout"
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Use o identificador do modelo do OpenRouter (ex: openai/gpt-4o-mini)
                </p>
              </div>
            ) : (
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="font-mono">{m.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {m.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Prompt */}
          <div className="space-y-1.5">
            <label className="text-sm font-mono font-medium">Prompt para a IA</label>
            <Textarea
              placeholder="Ex: Crie 3 módulos sobre Programação Orientada a Objetos com Java, incluindo conceitos de herança, polimorfismo e encapsulamento. Nível universitário mas fácil de entender."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button onClick={generate} disabled={loading || !prompt.trim()} className="w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {loading ? "Gerando conteúdo..." : "Gerar Conteúdo"}
          </Button>
        </CardContent>
      </Card>

      {/* Preview generated content */}
      {generated && (
        <Card className="bg-card border-primary/30 border-2">
          <CardHeader>
            <CardTitle className="font-mono text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Pré-visualização
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Revise o conteúdo gerado antes de salvar no banco de dados.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Course info */}
            <div className="bg-secondary/20 rounded-lg p-3 space-y-1">
              <p className="text-sm font-mono font-bold">{generated.curso?.nome}</p>
              <p className="text-xs text-muted-foreground">{generated.curso?.descricao}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{generated.modulos?.length || 0} módulos</Badge>
                <Badge variant="secondary">{totalTopicos} tópicos</Badge>
                <Badge variant="secondary">{generated.resumos?.length || 0} resumos</Badge>
                <Badge variant={generated.curso?.is_new ? "default" : "outline"}>
                  {generated.curso?.is_new ? "Curso novo" : "Expansão"}
                </Badge>
              </div>
            </div>

            {/* Modules preview */}
            {generated.modulos?.map((modulo: any, mi: number) => (
              <div key={mi} className="border border-border rounded-lg p-3 space-y-2">
                <p className="text-sm font-mono font-bold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  {modulo.nome}
                </p>
                <p className="text-xs text-muted-foreground">{modulo.descricao}</p>
                <div className="space-y-1 pl-4">
                  {modulo.topicos?.map((topico: any, ti: number) => (
                    <div key={ti} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-mono">{topico.ordem}.</span>
                      <span className="font-medium">{topico.titulo}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{topico.moedas}🪙</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Resumos preview */}
            {generated.resumos?.length > 0 && (
              <div className="border border-border rounded-lg p-3 space-y-2">
                <p className="text-sm font-mono font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Resumos ({generated.resumos.length})
                </p>
                <div className="space-y-1 pl-4">
                  {generated.resumos.map((r: any, ri: number) => (
                    <div key={ri} className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{r.materia}</Badge>
                      <span className="font-medium">{r.titulo}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={insertContent} disabled={inserting} className="w-full gap-2" variant="default">
              {inserting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {inserting ? "Salvando..." : "Salvar no Banco de Dados"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


// ─── AUDIOBOOKS TAB ─────────────────────────────────────────
function AudiobooksTab() {
  const [categorias, setCategorias] = useState<{ id: string; nome: string; icone: string | null; ordem: number }[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [capitulos, setCapitulos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"books" | "categorias">("books");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [capDialogOpen, setCapDialogOpen] = useState(false);
  const [capListBookId, setCapListBookId] = useState<string | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [editingCap, setEditingCap] = useState<any>(null);
  const [form, setForm] = useState({ titulo: "", autor: "", descricao: "", capa_url: "", categoria_id: "" });
  const [catForm, setCatForm] = useState({ nome: "", icone: "📚" });
  const [capForm, setCapForm] = useState({ titulo: "", descricao: "", audio_url: "", duracao_segundos: "" });
  const [uploadingCapa, setUploadingCapa] = useState(false);
  const capaInputRef = useRef<HTMLInputElement>(null);

  const uploadCapa = async (file: File) => {
    setUploadingCapa(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("audiobook-covers").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("audiobook-covers").getPublicUrl(fileName);
      setForm((f) => ({ ...f, capa_url: publicUrl }));
      toast.success("Capa enviada!");
    } catch (e: any) {
      toast.error("Erro ao enviar capa: " + e.message);
    } finally {
      setUploadingCapa(false);
    }
  };

  const loadCategorias = async () => {
    const { data } = await supabase.from("audiobook_categorias").select("*").order("ordem");
    if (data) setCategorias(data);
  };
  const loadBooks = async () => {
    const { data } = await supabase.from("audiobooks").select("*, audiobook_categorias(nome)").order("ordem");
    if (data) setBooks(data);
  };
  const loadCapitulos = async () => {
    const { data } = await supabase.from("audiobook_capitulos").select("*").order("ordem");
    if (data) setCapitulos(data);
  };
  useEffect(() => { loadCategorias(); loadBooks(); loadCapitulos(); }, []);

  const saveBook = async () => {
    if (!form.titulo) { toast.error("Título é obrigatório"); return; }
    const payload: any = {
      titulo: form.titulo, autor: form.autor || null, descricao: form.descricao || null,
      capa_url: form.capa_url || null, categoria_id: form.categoria_id || null,
      ordem: editing ? editing.ordem : books.length,
    };
    if (!editing) payload.audio_url = "placeholder";
    if (editing) { await supabase.from("audiobooks").update(payload).eq("id", editing.id); }
    else { await supabase.from("audiobooks").insert(payload); }
    toast.success("Audiobook salvo!"); setDialogOpen(false); setEditing(null);
    setForm({ titulo: "", autor: "", descricao: "", capa_url: "", categoria_id: "" });
    loadBooks();
  };

  const removeBook = async (id: string) => {
    await supabase.from("audiobooks").delete().eq("id", id);
    toast.success("Removido!"); loadBooks(); loadCapitulos();
  };

  const saveCat = async () => {
    if (!catForm.nome) return;
    const payload = { nome: catForm.nome, icone: catForm.icone || "📚", ordem: editingCat ? editingCat.ordem : categorias.length };
    if (editingCat) { await supabase.from("audiobook_categorias").update(payload).eq("id", editingCat.id); }
    else { await supabase.from("audiobook_categorias").insert(payload); }
    toast.success("Categoria salva!"); setCatDialogOpen(false); setEditingCat(null); setCatForm({ nome: "", icone: "📚" });
    loadCategorias();
  };

  const removeCat = async (id: string) => {
    await supabase.from("audiobook_categorias").delete().eq("id", id);
    toast.success("Removida!"); loadCategorias();
  };

  const saveCap = async () => {
    if (!capForm.titulo || !capForm.audio_url || !capListBookId) { toast.error("Título e URL do áudio são obrigatórios"); return; }
    const bookCaps = capitulos.filter((c: any) => c.audiobook_id === capListBookId);
    const payload = {
      audiobook_id: capListBookId,
      titulo: capForm.titulo, descricao: capForm.descricao || null,
      audio_url: capForm.audio_url,
      duracao_segundos: capForm.duracao_segundos ? parseInt(capForm.duracao_segundos) : 0,
      ordem: editingCap ? editingCap.ordem : bookCaps.length,
    };
    if (editingCap) { await supabase.from("audiobook_capitulos").update(payload).eq("id", editingCap.id); }
    else { await supabase.from("audiobook_capitulos").insert(payload); }
    toast.success("Capítulo salvo!"); setCapDialogOpen(false); setEditingCap(null);
    setCapForm({ titulo: "", descricao: "", audio_url: "", duracao_segundos: "" });
    loadCapitulos();
  };

  const removeCap = async (id: string) => {
    await supabase.from("audiobook_capitulos").delete().eq("id", id);
    toast.success("Removido!"); loadCapitulos();
  };

  const editBook = (item: any) => {
    setEditing(item);
    setForm({ titulo: item.titulo, autor: item.autor || "", descricao: item.descricao || "", capa_url: item.capa_url || "", categoria_id: item.categoria_id || "" });
    setDialogOpen(true);
  };

  const fmtDur = (s: number) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h${m}min` : `${m}min`; };

  const bookBeingViewed = capListBookId ? books.find((b: any) => b.id === capListBookId) : null;
  const bookCapsFiltered = capitulos.filter((c: any) => c.audiobook_id === capListBookId);

  if (capListBookId && bookBeingViewed) {
    return (
      <div className="space-y-4 mt-4">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => setCapListBookId(null)}>
          <ArrowLeft className="h-4 w-4" /> Voltar para audiobooks
        </Button>
        <CrudSection
          title={`Capítulos — ${bookBeingViewed.titulo}`}
          count={bookCapsFiltered.length}
          onAdd={() => { setEditingCap(null); setCapForm({ titulo: "", descricao: "", audio_url: "", duracao_segundos: "" }); setCapDialogOpen(true); }}
        >
          <Table>
            <TableHeader><TableRow><TableHead className="w-12">#</TableHead><TableHead>Título</TableHead><TableHead>Duração</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {bookCapsFiltered.map((cap: any, idx: number) => (
                <TableRow key={cap.id}>
                  <TableCell className="font-mono text-sm">{idx + 1}</TableCell>
                  <TableCell>
                    <p className="font-mono text-sm">{cap.titulo}</p>
                    {cap.descricao && <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{cap.descricao}</p>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cap.duracao_segundos ? fmtDur(cap.duracao_segundos) : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingCap(cap); setCapForm({ titulo: cap.titulo, descricao: cap.descricao || "", audio_url: cap.audio_url, duracao_segundos: cap.duracao_segundos?.toString() || "" }); setCapDialogOpen(true); }}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                       <ConfirmDeleteButton onConfirm={() => removeCap(cap.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {bookCapsFiltered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum capítulo. Adicione acima!</p>}
        </CrudSection>

        <Dialog open={capDialogOpen} onOpenChange={setCapDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-mono">{editingCap ? "Editar" : "Novo"} Capítulo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Título do capítulo *" value={capForm.titulo} onChange={(e) => setCapForm({ ...capForm, titulo: e.target.value })} />
              <Input placeholder="Descrição (opcional)" value={capForm.descricao} onChange={(e) => setCapForm({ ...capForm, descricao: e.target.value })} />
              <Input placeholder="URL do áudio (Cloudflare R2) *" value={capForm.audio_url} onChange={(e) => setCapForm({ ...capForm, audio_url: e.target.value })} />
              <Input placeholder="Duração em segundos (ex: 3600)" type="number" value={capForm.duracao_segundos} onChange={(e) => setCapForm({ ...capForm, duracao_segundos: e.target.value })} />
              <Button onClick={saveCap} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="books" className="flex-1">Audiobooks</TabsTrigger>
          <TabsTrigger value="categorias" className="flex-1">Categorias</TabsTrigger>
        </TabsList>
        <TabsContent value="books">
          <CrudSection title="Audiobooks" count={books.length} onAdd={() => { setEditing(null); setForm({ titulo: "", autor: "", descricao: "", capa_url: "", categoria_id: "" }); setDialogOpen(true); }}>
            <Table>
              <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Autor</TableHead><TableHead>Categoria</TableHead><TableHead>Caps</TableHead><TableHead className="w-28">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {books.map((bk: any) => {
                  const capCount = capitulos.filter((c: any) => c.audiobook_id === bk.id).length;
                  return (
                    <TableRow key={bk.id}>
                      <TableCell><div className="flex items-center gap-2">{bk.capa_url && <img src={bk.capa_url} alt="" className="h-8 w-8 rounded object-cover" />}<span className="font-mono text-sm">{bk.titulo}</span></div></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{bk.autor || "—"}</TableCell>
                      <TableCell>{bk.audiobook_categorias ? <Badge variant="outline" className="text-primary border-primary/30">{bk.audiobook_categorias.nome}</Badge> : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setCapListBookId(bk.id)}>
                          <BookOpen className="h-3 w-3" /> {capCount}
                        </Button>
                      </TableCell>
                      <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => editBook(bk)}><Edit2 className="h-3 w-3" /></Button><ConfirmDeleteButton onConfirm={() => removeBook(bk.id)} /></div></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {books.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum audiobook cadastrado.</p>}
          </CrudSection>
        </TabsContent>
        <TabsContent value="categorias">
          <CrudSection title="Categorias" count={categorias.length} onAdd={() => { setEditingCat(null); setCatForm({ nome: "", icone: "📚" }); setCatDialogOpen(true); }}>
            <Table>
              <TableHeader><TableRow><TableHead className="w-16">Ícone</TableHead><TableHead>Nome</TableHead><TableHead className="w-24">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {categorias.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="text-xl">{cat.icone || "📚"}</TableCell>
                    <TableCell className="font-mono text-sm">{cat.nome}</TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setCatForm({ nome: cat.nome, icone: cat.icone || "📚" }); setCatDialogOpen(true); }}><Edit2 className="h-3 w-3" /></Button><ConfirmDeleteButton onConfirm={() => removeCat(cat.id)} /></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {categorias.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada.</p>}
          </CrudSection>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-mono">{editing ? "Editar" : "Novo"} Audiobook</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título *" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            <Input placeholder="Autor" value={form.autor} onChange={(e) => setForm({ ...form, autor: e.target.value })} />
            <Textarea placeholder="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono">Capa (imagem)</p>
              {form.capa_url && (
                <div className="relative w-20 h-20">
                  <img src={form.capa_url} alt="Capa" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-5 w-5 bg-destructive/90 hover:bg-destructive text-white rounded-full" onClick={() => setForm({ ...form, capa_url: "" })}><X className="h-3 w-3" /></Button>
                </div>
              )}
              <input ref={capaInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCapa(f); e.target.value = ""; }} />
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => capaInputRef.current?.click()} disabled={uploadingCapa}>
                {uploadingCapa ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                {uploadingCapa ? "Enviando..." : "Enviar capa"}
              </Button>
            </div>
            <Select value={form.categoria_id} onValueChange={(v) => setForm({ ...form, categoria_id: v })}>
              <SelectTrigger><SelectValue placeholder="Categoria (opcional)" /></SelectTrigger>
              <SelectContent>{categorias.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.icone} {cat.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={saveBook} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-mono">{editingCat ? "Editar" : "Nova"} Categoria</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da categoria" value={catForm.nome} onChange={(e) => setCatForm({ ...catForm, nome: e.target.value })} />
            <Input placeholder="Emoji/ícone (ex: 📚)" value={catForm.icone} onChange={(e) => setCatForm({ ...catForm, icone: e.target.value })} />
            <Button onClick={saveCat} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── LIVROS PDF TAB ─────────────────────────────────────────
function LivrosPdfTab() {
  const [items, setItems] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ titulo: "", autor: "", categoria: "", capa_url: "", pdf_url: "" });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("livros_pdf").select("*").order("ordem");
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("livros-pdf").upload(path, file);
    if (error) { toast.error("Erro no upload: " + error.message); return null; }
    const { data: pub } = supabase.storage.from("livros-pdf").getPublicUrl(path);
    return pub.publicUrl;
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, "pdfs");
    if (url) setForm((f) => ({ ...f, pdf_url: url }));
    setUploading(false);
  };

  const handleCapaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, "capas");
    if (url) setForm((f) => ({ ...f, capa_url: url }));
    setUploading(false);
  };

  const save = async () => {
    if (!form.titulo || !form.pdf_url) { toast.error("Título e PDF são obrigatórios"); return; }
    const payload = {
      titulo: form.titulo,
      autor: form.autor || null,
      categoria: form.categoria || null,
      capa_url: form.capa_url || null,
      pdf_url: form.pdf_url,
      ordem: editing ? editing.ordem : items.length,
    };
    if (editing) {
      await supabase.from("livros_pdf").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("livros_pdf").insert(payload);
    }
    toast.success("Livro salvo!"); setDialogOpen(false); setEditing(null);
    setForm({ titulo: "", autor: "", categoria: "", capa_url: "", pdf_url: "" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("livros_pdf").delete().eq("id", id);
    toast.success("Livro removido!"); load();
  };

  const removeAll = async () => {
    const ids = items.map((i) => i.id);
    if (ids.length === 0) return;
    await supabase.from("livros_pdf").delete().in("id", ids);
    toast.success("Todos os livros removidos!"); load();
  };

  return (
    <CrudSection title="Livros PDF" count={items.length} onAdd={() => { setEditing(null); setForm({ titulo: "", autor: "", categoria: "", capa_url: "", pdf_url: "" }); setDialogOpen(true); }} onRemoveAll={items.length > 0 ? removeAll : undefined}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Autor</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-sm">{item.ordem + 1}</TableCell>
              <TableCell className="font-mono text-sm">{item.titulo}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.autor || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.categoria || "—"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setForm({ titulo: item.titulo, autor: item.autor || "", categoria: item.categoria || "", capa_url: item.capa_url || "", pdf_url: item.pdf_url }); setDialogOpen(true); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <ConfirmDeleteButton onConfirm={() => remove(item.id)} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">{editing ? "Editar" : "Novo"} Livro PDF</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título *" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
            <Input placeholder="Autor" value={form.autor} onChange={(e) => setForm((f) => ({ ...f, autor: e.target.value }))} />
            <Input placeholder="Categoria" value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} />
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground">Capa (imagem)</label>
              <Input type="file" accept="image/*" onChange={handleCapaUpload} />
              {form.capa_url && <img src={form.capa_url} alt="Capa" className="h-20 rounded-lg object-cover" />}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground">Arquivo PDF *</label>
              <Input type="file" accept=".pdf" onChange={handlePdfUpload} />
              {form.pdf_url && <p className="text-[10px] text-primary font-mono truncate">✓ PDF carregado</p>}
            </div>

            <Button onClick={save} disabled={uploading} className="w-full">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CrudSection>
  );
}

function CrudSection({ title, count, onAdd, onRemoveAll, children }: { title: string; count: number; onAdd: () => void; onRemoveAll?: () => void; children: React.ReactNode }) {
  return (
    <Card className="bg-card border-border mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="font-mono text-lg flex items-center gap-2">
          {title} <Badge variant="secondary">{count}</Badge>
        </CardTitle>
        <div className="flex gap-2">
          {onRemoveAll && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="h-3 w-3" /> Apagar Todos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[280px] rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-sm font-mono">Apagar todos?</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs">Essa ação é irreversível. Todos os {count} itens serão removidos permanentemente.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-xs h-8">Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="text-xs h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onRemoveAll}>Apagar Todos</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={onAdd} size="sm" className="gap-1"><Plus className="h-3 w-3" /> Adicionar</Button>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default Admin;

function ConfirmDeleteButton({ onConfirm, label = "Tem certeza que deseja remover?" }: { onConfirm: () => void; label?: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[280px] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm font-mono">Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">{label}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs h-8">Cancelar</AlertDialogCancel>
          <AlertDialogAction className="text-xs h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
