import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MessageCircle, Send, X, ChevronRight, Bell, CheckCircle2, Trophy, Minus, PlayCircle, Reply, Pencil, Check, Trash2, Bot } from "lucide-react";
import { format, differenceInHours, differenceInMilliseconds } from "date-fns";
import { CircularProgress } from "@/components/CircularProgress";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SegmentProgress } from "@/components/SegmentProgress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout } from "@/components/Layout";
import { PageContainer } from "@/components/PageContainer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppFeatures } from "@/contexts/AppFeaturesContext";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

interface CursoDB {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  modulos_count?: number;
  total_topicos?: number;
  completed_topicos?: number;
}

interface Mensagem {
  id: string;
  remetente: string;
  conteudo: string;
  created_at: string;
  reply_to: string | null;
  editado: boolean;
}

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string | null;
  link: string | null;
  lida: boolean;
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { features } = useAppFeatures();
  const reduceMotion = useReducedMotion();
  const [cursos, setCursos] = useState<CursoDB[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [chatAberto, setChatAberto] = useState(false);
  const [chatMinimizado, setChatMinimizado] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notifAberta, setNotifAberta] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [desafiosCount, setDesafiosCount] = useState({ total: 0, respondidos: 0 });
  const [frases, setFrases] = useState<string[]>([]);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [adminConfig, setAdminConfig] = useState<{ nome: string; avatar_url: string | null }>({ nome: "Admin", avatar_url: null });
  const [replyTo, setReplyTo] = useState<Mensagem | null>(null);
  const [editingMsg, setEditingMsg] = useState<Mensagem | null>(null);
  const [longPressMsg, setLongPressMsg] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [cursoRes, modRes, topRes, mRes, progRes, notifRes, desafiosRes, respostasRes, frasesRes, adminRes] = await Promise.all([
        supabase.from("cursos").select("*").order("ordem"),
        supabase.from("modulos").select("id, curso_id"),
        supabase.from("modulo_topicos").select("modulo_id, id"),
        supabase.from("mensagens").select("*").gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()).order("created_at", { ascending: true }),
        supabase.from("topico_progresso").select("topico_id"),
        supabase.from("notificacoes").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("desafios_semanais").select("id"),
        supabase.from("desafio_respostas").select("desafio_id"),
        supabase.from("frases_motivacionais").select("texto").eq("ativa", true),
        supabase.from("admin_config").select("nome, avatar_url").eq("id", 1).single(),
      ]);

      const topicosByModule = new Map<string, string[]>();
      (topRes.data || []).forEach((t: any) => {
        const arr = topicosByModule.get(t.modulo_id) || [];
        arr.push(t.id);
        topicosByModule.set(t.modulo_id, arr);
      });

      const completedSet = new Set((progRes.data || []).map((p: any) => p.topico_id));

      const modulesByCurso = new Map<string, string[]>();
      (modRes.data || []).forEach((m: any) => {
        if (m.curso_id) {
          const arr = modulesByCurso.get(m.curso_id) || [];
          arr.push(m.id);
          modulesByCurso.set(m.curso_id, arr);
        }
      });

      const cursosData = (cursoRes.data || []).map((c: any) => {
        const modIds = modulesByCurso.get(c.id) || [];
        let totalTopicos = 0;
        let completedTopicos = 0;
        modIds.forEach((modId) => {
          const topicIds = topicosByModule.get(modId) || [];
          totalTopicos += topicIds.length;
          completedTopicos += topicIds.filter((tid) => completedSet.has(tid)).length;
        });
        return { ...c, modulos_count: modIds.length, total_topicos: totalTopicos, completed_topicos: completedTopicos };
      });
      setCursos(cursosData);

      const totalTopics = Array.from(topicosByModule.values()).flat().length;
      setOverallProgress(totalTopics > 0 ? (completedSet.size / totalTopics) * 100 : 0);

      if (mRes.data) {
        setMensagens(mRes.data);
        setNaoLidas(mRes.data.filter((m: any) => m.remetente === "admin" && !m.lida).length);
      }
      if (notifRes.data) setNotificacoes(notifRes.data);
      if (desafiosRes.data) {
        const respondidos = (respostasRes.data || []).length;
        setDesafiosCount({ total: desafiosRes.data.length, respondidos });
      }
      if (frasesRes.data) setFrases(frasesRes.data.map((f: any) => f.texto));
      if (adminRes.data) setAdminConfig({ nome: adminRes.data.nome, avatar_url: adminRes.data.avatar_url });
    };
    fetchAll();

    // Cleanup old messages (48h)
    supabase.from("mensagens").delete().lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

    // Realtime subscription for mensagens
    const channel = supabase
      .channel("mensagens-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensagens" },
        (payload) => {
          const newMsg = payload.new as Mensagem;
          setMensagens((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.remetente === "admin") {
            setNaoLidas((prev) => prev + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mensagens" },
        (payload) => {
          const updated = payload.new as Mensagem;
          setMensagens((prev) => prev.map((m) => m.id === updated.id ? updated : m));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "mensagens" },
        (payload) => {
          const old = payload.old as { id: string };
          setMensagens((prev) => prev.filter((m) => m.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (chatAberto && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens, chatAberto]);

  useEffect(() => {
    if (frases.length <= 1) return;
    const interval = setInterval(() => setFraseIdx((p) => (p + 1) % frases.length), 6000);
    return () => clearInterval(interval);
  }, [frases]);

  const abrirChat = async () => {
    setChatAberto(true);
    setChatMinimizado(false);
    setNaoLidas(0);
    await supabase.from("mensagens").update({ lida: true }).eq("remetente", "admin").eq("lida", false);
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;
    const texto = novaMensagem.trim();
    setNovaMensagem("");

    if (editingMsg) {
      // Edit mode
      await supabase.from("mensagens").update({ conteudo: texto, editado: true }).eq("id", editingMsg.id);
      setEditingMsg(null);
      return;
    }

    const payload: any = { remetente: "bella", conteudo: texto };
    if (replyTo) {
      payload.reply_to = replyTo.id;
      setReplyTo(null);
    }
    await supabase.from("mensagens").insert(payload).select().single();
  };

  const canEdit = (msg: Mensagem) => {
    if (msg.remetente !== "bella") return false;
    const diff = Date.now() - new Date(msg.created_at).getTime();
    return diff < 3 * 60 * 1000; // 3 minutes
  };

  const startEdit = (msg: Mensagem) => {
    setEditingMsg(msg);
    setReplyTo(null);
    setNovaMensagem(msg.conteudo);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingMsg(null);
    setNovaMensagem("");
  };

  const handleSwipeReply = (msg: Mensagem) => {
    setReplyTo(msg);
    setEditingMsg(null);
    setNovaMensagem("");
    inputRef.current?.focus();
  };

  const deletarMensagem = async (msg: Mensagem) => {
    await supabase.from("mensagens").delete().eq("id", msg.id);
    setMensagens((prev) => prev.filter((m) => m.id !== msg.id));
  };

  const formatMsgTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffH = differenceInHours(now, date);
    if (diffH < 24) return format(date, "HH:mm");
    return format(date, "dd/MM HH:mm");
  };

  const getReplyPreview = (replyId: string | null) => {
    if (!replyId) return null;
    return mensagens.find((m) => m.id === replyId);
  };

  const marcarNotifLida = async (notif: Notificacao) => {
    if (!notif.lida) {
      await supabase.from("notificacoes").update({ lida: true }).eq("id", notif.id);
      setNotificacoes((prev) => prev.map((n) => (n.id === notif.id ? { ...n, lida: true } : n)));
    }
    if (notif.link) { setNotifAberta(false); navigate(notif.link); }
  };

  const notifNaoLidas = notificacoes.filter((n) => !n.lida).length;
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const hoverLift = reduceMotion ? {} : { y: -2, scale: 1.01 };
  const tapDown = reduceMotion ? {} : { scale: 0.99 };

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-10 pb-20">

        {/* Header */}
        <motion.div variants={item}>
          <div className="relative rounded-2xl bg-card border border-border p-5">
            {/* Decorative glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-accent/10 blur-2xl pointer-events-none" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-mono tracking-wider uppercase">{saudacao}</p>
                <h1 className="text-2xl font-bold font-mono mt-1">
                  Olá, <span className="text-gradient">{profile?.display_name || "Estudante"}</span>
                </h1>
              </div>
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => setNotifAberta(!notifAberta)}>
                  <Bell className="h-4 w-4" />
                  {notifNaoLidas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {notifNaoLidas}
                    </span>
                  )}
                </Button>
                <AnimatePresence>
                  {notifAberta && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 top-11 w-72 z-50">
                      <Card className="bg-card border-border shadow-xl">
                        <div className="flex items-center justify-between p-3 border-b border-border">
                          <span className="font-mono text-xs font-semibold">Notificações</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNotifAberta(false)}><X className="h-3 w-3" /></Button>
                        </div>
                        <ScrollArea className="max-h-56">
                          {notificacoes.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-6">Sem notificações</p>
                          ) : (
                            <div className="divide-y divide-border">
                              {notificacoes.map((n) => (
                                <button key={n.id} onClick={() => marcarNotifLida(n)} className={`w-full text-left p-3 hover:bg-secondary/40 transition-colors ${!n.lida ? "bg-primary/5" : ""}`}>
                                  <p className={`text-xs font-mono ${!n.lida ? "font-semibold" : "text-muted-foreground"}`}>{n.titulo}</p>
                                  {n.mensagem && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{n.mensagem}</p>}
                                </button>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Frase Motivacional */}
        {frases.length > 0 && (
          <motion.div variants={item}>
            <div className="relative rounded-lg bg-primary/5 border border-primary/10 px-5 py-4 overflow-hidden">
              <span className="absolute top-2 left-3 text-primary/20 text-2xl font-serif leading-none">"</span>
              <AnimatePresence mode="wait">
                <motion.p
                  key={fraseIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-sm text-center text-foreground/70 italic pl-4"
                >
                  {frases[fraseIdx]}
                </motion.p>
              </AnimatePresence>
              {frases.length > 1 && (
                <div className="flex justify-center gap-1 mt-3">
                  {frases.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setFraseIdx(i)}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        i === fraseIdx ? "w-6 bg-primary" : "w-1.5 bg-muted hover:bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Progress & Desafios - side by side */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div variants={item} whileHover={hoverLift} whileTap={tapDown}>
            <Link to="/progresso">
              <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Progresso</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3">
                  <CircularProgress value={overallProgress} size={56} strokeWidth={4} variant="gradient" />
                  <div>
                    <p className="text-2xl font-bold font-mono text-gradient">{Math.round(overallProgress)}%</p>
                    <p className="text-[10px] text-muted-foreground">Concluído</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
          <motion.div variants={item} whileHover={hoverLift} whileTap={tapDown}>
            <Link to="/desafios">
              <div className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> Desafios
                  </span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-3">
                  <CircularProgress value={desafiosCount.total > 0 ? (desafiosCount.respondidos / desafiosCount.total) * 100 : 0} size={56} strokeWidth={4} />
                  <div>
                    <p className="text-2xl font-bold font-mono">
                      <span className="text-gradient">{desafiosCount.respondidos}</span>
                      <span className="text-muted-foreground text-sm">/{desafiosCount.total}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">Respondidos</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Acesso Rápido */}
        <motion.div variants={item} className="space-y-3">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Acesso rápido</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Resumos", to: "/resumos", icon: "📖", type: "emoji" as const },
              { label: "Flashcards", to: "/flashcards", icon: "🧠", type: "emoji" as const },
              { label: "Mix", to: "/mix", icon: PlayCircle, type: "icon" as const },
              { label: "Belinha", to: "/belinha", icon: Bot, type: "icon" as const },
            ].map((a) => {
              const IconComponent = a.type === "icon" ? a.icon as React.ComponentType<{ className?: string }> : null;
              return (
                <Link key={a.to} to={a.to}>
                  <motion.div whileHover={hoverLift} whileTap={tapDown} className="group flex flex-col items-center gap-1.5 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-all cursor-pointer">
                    {a.type === "emoji" ? (
                      <span className="text-lg">{a.icon as string}</span>
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                        {IconComponent && <IconComponent className="h-4 w-4 text-primary" />}
                      </div>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">{a.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Cursos */}
        <motion.div variants={item} className="space-y-3">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Cursos</p>
          {cursos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum curso cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {cursos.map((curso) => {
                const pct = (curso.total_topicos || 0) > 0 ? ((curso.completed_topicos || 0) / (curso.total_topicos || 1)) * 100 : 0;
                return (
                  <Link key={curso.id} to={`/curso/${curso.id}`}>
                    <motion.div whileHover={hoverLift} whileTap={tapDown} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-all cursor-pointer">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-mono font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        {pct === 100 ? <CheckCircle2 className="h-4 w-4 text-primary" /> : "📚"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">{curso.nome}</p>
                        {curso.descricao && <p className="text-xs text-muted-foreground truncate">{curso.descricao}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <SegmentProgress value={pct} segments={5} className="flex-1" />
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <p className="text-[9px] text-muted-foreground/60 mt-0.5">
                          {curso.modulos_count || 0} módulos · {curso.completed_topicos || 0}/{curso.total_topicos || 0} tópicos
                        </p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

      </motion.div>

      {/* Chat Flutuante */}
      <AnimatePresence>
        {chatAberto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed right-4 left-4 sm:left-auto sm:w-[340px] z-50 ${chatMinimizado ? "bottom-8" : "bottom-16"}`}
            style={{ transformOrigin: "bottom right" }}
          >
            <div className="rounded-2xl bg-background/80 backdrop-blur-2xl border border-border/30 shadow-[0_8px_60px_-12px_hsl(var(--primary)/0.15)] overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3.5 cursor-pointer border-b border-border/20"
                onClick={() => setChatMinimizado(!chatMinimizado)}
              >
                <div className="flex items-center gap-2.5">
                  {adminConfig.avatar_url ? (
                    <img src={adminConfig.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-border/30" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <MessageCircle className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium text-foreground">{chatMinimizado ? "Chat" : adminConfig.nome}</span>
                  </div>
                  {naoLidas > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground">
                      {naoLidas}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-all"
                    onClick={(e) => { e.stopPropagation(); setChatMinimizado(!chatMinimizado); }}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-all"
                    onClick={(e) => { e.stopPropagation(); setChatAberto(false); }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <AnimatePresence>
                {!chatMinimizado && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <ScrollArea className="h-72 px-4 py-3" onClick={() => setLongPressMsg(null)}>
                      <div className="space-y-2.5">
                        {mensagens.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                              <MessageCircle className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                            <p className="text-[11px] text-muted-foreground/40">Nenhuma mensagem ainda</p>
                          </div>
                        )}
                        {mensagens.map((msg) => {
                          const isUser = msg.remetente === "bella";
                          const replyMsg = getReplyPreview(msg.reply_to);
                          return (
                            <motion.div
                              key={msg.id}
                              className={`flex flex-col ${isUser ? "items-end" : "items-start"} relative group`}
                              drag="x"
                              dragConstraints={{ left: 0, right: 0 }}
                              dragElastic={0.3}
                              onDragEnd={(_e: any, info: PanInfo) => {
                                if (Math.abs(info.offset.x) > 50) {
                                  handleSwipeReply(msg);
                                }
                              }}
                              style={{ touchAction: "pan-y" }}
                            >
                              {/* Reply preview */}
                              {replyMsg && (
                                <div className={`max-w-[75%] mb-1 px-2.5 py-1 rounded-lg bg-secondary/30 border-l-2 border-primary/30 ${isUser ? "mr-1" : "ml-1"}`}>
                                  <p className="text-[9px] font-medium text-primary/60">
                                    {replyMsg.remetente === "admin" ? adminConfig.nome : profile?.display_name || "Você"}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground/60 truncate">{replyMsg.conteudo}</p>
                                </div>
                              )}

                              {/* Message bubble */}
                              <div className="relative max-w-[80%]">
                                <div
                                  className={`rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed select-none ${
                                    isUser
                                      ? "bg-primary/90 text-primary-foreground rounded-br-sm"
                                      : "bg-secondary/40 text-foreground/90 rounded-bl-sm"
                                  } ${longPressMsg === msg.id ? "ring-1 ring-primary/30" : ""}`}
                                  onTouchStart={() => {
                                    if (!isUser) return;
                                    longPressTimer.current = setTimeout(() => {
                                      longPressTimer.current = null;
                                      setLongPressMsg(msg.id);
                                    }, 500);
                                  }}
                                  onTouchEnd={(e) => {
                                    if (longPressTimer.current) {
                                      clearTimeout(longPressTimer.current);
                                      longPressTimer.current = null;
                                    }
                                    if (longPressMsg === msg.id) e.preventDefault();
                                  }}
                                  onMouseDown={() => {
                                    if (!isUser) return;
                                    longPressTimer.current = setTimeout(() => {
                                      longPressTimer.current = null;
                                      setLongPressMsg(msg.id);
                                    }, 500);
                                  }}
                                  onMouseUp={() => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
                                  onContextMenu={(e) => { e.preventDefault(); if (isUser) setLongPressMsg(msg.id); }}
                                >
                                  <span>{msg.conteudo}</span>
                                  <span className={`inline-flex items-center gap-1 ml-2 align-bottom text-[8px] whitespace-nowrap ${isUser ? "text-primary-foreground/35" : "text-muted-foreground/35"}`}>
                                    {msg.editado && <span>editado ·</span>}
                                    {formatMsgTime(msg.created_at)}
                                  </span>
                                </div>

                                {/* Long-press action menu */}
                                <AnimatePresence>
                                  {longPressMsg === msg.id && isUser && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9, y: 4 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.9, y: 4 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute -top-11 right-0 z-10 flex items-center gap-0.5 rounded-xl bg-card/95 backdrop-blur-xl border border-border/30 shadow-lg px-1 py-1"
                                      onClick={(e) => e.stopPropagation()}
                                      onPointerDown={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={() => { handleSwipeReply(msg); setLongPressMsg(null); }}
                                        className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                                      >
                                        <Reply className="h-3 w-3" />
                                        <span>Responder</span>
                                      </button>
                                      {canEdit(msg) && (
                                        <button
                                          onClick={() => { startEdit(msg); setLongPressMsg(null); }}
                                          className="h-7 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
                                        >
                                          <Pencil className="h-3 w-3" />
                                          <span>Editar</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => { deletarMensagem(msg); setLongPressMsg(null); }}
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
                    </ScrollArea>

                    {/* Reply / Edit bar */}
                    <AnimatePresence>
                      {(replyTo || editingMsg) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 py-2 bg-secondary/20 border-t border-border/10 flex items-center gap-2">
                            {replyTo && (
                              <>
                                <Reply className="h-3 w-3 text-primary/60 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] font-medium text-primary/70">
                                    {replyTo.remetente === "admin" ? adminConfig.nome : profile?.display_name || "Você"}
                                  </p>
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
                            <button
                              onClick={() => { setReplyTo(null); cancelEdit(); }}
                              className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-secondary/50 transition-colors"
                            >
                              <X className="h-2.5 w-2.5 text-muted-foreground/50" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Input */}
                    <div className="p-3 border-t border-border/10">
                      <div className="flex items-center gap-2 rounded-xl bg-secondary/30 px-3 py-1">
                        <Input
                          ref={inputRef}
                          placeholder={editingMsg ? "Editar mensagem..." : "Mensagem..."}
                          value={novaMensagem}
                          onChange={(e) => setNovaMensagem(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") enviarMensagem();
                            if (e.key === "Escape") { setReplyTo(null); cancelEdit(); }
                          }}
                          className="flex-1 h-8 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/30"
                        />
                        <button
                          onClick={enviarMensagem}
                          disabled={!novaMensagem.trim()}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
                        >
                          {editingMsg ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat FAB - Tech style */}
      {!chatAberto && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={abrirChat}
          className="fixed bottom-6 right-4 z-50 h-9 px-3 rounded-lg bg-card/80 backdrop-blur-xl border border-primary/20 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.25),0_0_6px_-2px_hsl(var(--primary)/0.15)] flex items-center gap-1.5 transition-all hover:border-primary/40 hover:shadow-[0_0_20px_-3px_hsl(var(--primary)/0.4)] group"
        >
          <span className="text-primary/60 text-[10px] font-mono group-hover:text-primary transition-colors">&gt;_</span>
          <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">chat</span>
          {naoLidas > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/90 text-[8px] font-bold text-primary-foreground px-1">
              {naoLidas}
            </span>
          )}
        </motion.button>
      )}
    </Layout>
  );
};

export default Index;
