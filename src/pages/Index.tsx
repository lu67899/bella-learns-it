import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Terminal, Send, X, ChevronRight, Bell, CheckCircle2, Trophy, Minus, PlayCircle, Reply, Pencil, Check, Trash2, Bot, Headphones, Code } from "lucide-react";
import { WeatherWidget } from "@/components/WeatherWidget";
import { format, differenceInHours, differenceInMilliseconds } from "date-fns";
import { CircularProgress } from "@/components/CircularProgress";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SegmentProgress } from "@/components/SegmentProgress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout } from "@/components/Layout";
import { useSidebar } from "@/components/ui/sidebar";

function SidebarMenuButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full md:hidden" onClick={toggleSidebar}>
      <Terminal className="h-4 w-4" />
    </Button>
  );
}

function useAutoOpenSidebar() {
  const location = useLocation();
  const { setOpenMobile, isMobile } = useSidebar();
  useEffect(() => {
    if (location.state?.openSidebar && isMobile) {
      setOpenMobile(true);
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, "");
    }
  }, [location.state, isMobile, setOpenMobile]);
}
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
  useAutoOpenSidebar();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { features } = useAppFeatures();
  const reduceMotion = useReducedMotion();
  const [cursos, setCursos] = useState<CursoDB[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [chatAberto, setChatAberto] = useState(false);
  const [chatMinimizado, setChatMinimizado] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notifAberta, setNotifAberta] = useState(false);
  const [notifFiltro, setNotifFiltro] = useState<"nao_lidas" | "todas">("nao_lidas");
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
      const [cursoRes, modRes, topRes, mRes, progRes, notifRes, desafiosRes, respostasRes, frasesRes, adminRes, inscRes] = await Promise.all([
        supabase.from("cursos").select("*").order("ordem"),
        supabase.from("modulos").select("id, curso_id"),
        supabase.from("modulo_topicos").select("modulo_id, id"),
        supabase.from("mensagens").select("*").gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()).order("created_at", { ascending: true }),
        supabase.from("topico_progresso").select("topico_id"),
        supabase.from("notificacoes").select("*").neq("tipo", "certificado").neq("tipo", "resgate").order("created_at", { ascending: false }).limit(20),
        supabase.from("desafios_semanais").select("id"),
        supabase.from("desafio_respostas").select("desafio_id"),
        supabase.from("frases_motivacionais").select("texto").eq("ativa", true),
        supabase.from("admin_config").select("nome, avatar_url").eq("id", 1).single(),
        supabase.from("inscricoes_cursos").select("curso_id"),
      ]);

      const enrolledSet = new Set((inscRes.data || []).map((i: any) => i.curso_id));
      setEnrolledIds(enrolledSet);

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

      // Calculate progress only for enrolled courses
      const enrolledCursoIds = [...enrolledSet];
      let enrolledTotalTopics = 0;
      let enrolledCompletedTopics = 0;
      enrolledCursoIds.forEach((cursoId) => {
        const modIds = modulesByCurso.get(cursoId) || [];
        modIds.forEach((modId) => {
          const topicIds = topicosByModule.get(modId) || [];
          enrolledTotalTopics += topicIds.length;
          enrolledCompletedTopics += topicIds.filter((tid) => completedSet.has(tid)).length;
        });
      });
      setOverallProgress(enrolledTotalTopics > 0 ? (enrolledCompletedTopics / enrolledTotalTopics) * 100 : 0);

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
          <div className="relative rounded-2xl bg-card border border-border px-5 py-6">
            {/* Decorative glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-accent/10 blur-2xl pointer-events-none" />

            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase mb-1">{saudacao}</p>
                <h1 className="text-xl font-bold font-mono truncate">
                  <span className="text-gradient">{profile?.display_name || "Estudante"}</span> ✨
                </h1>
              </div>
              <div className="shrink-0 flex items-center gap-1">
                <SidebarMenuButton />
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full" onClick={abrirChat}>
                  <Code className="h-4 w-4" />
                  {naoLidas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {naoLidas}
                    </span>
                  )}
                </Button>
                <Link to="/notificacoes">
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    <Bell className="h-4 w-4" />
                    {notifNaoLidas > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {notifNaoLidas}
                      </span>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Weather Widget */}
        <motion.div variants={item}>
          <WeatherWidget frases={frases} fraseIdx={fraseIdx} />
        </motion.div>

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
              { label: "Jogos", to: "/jogos", icon: "🎮", type: "emoji" as const },
              { label: "Mix", to: "/mix", icon: PlayCircle, type: "icon" as const },
              
              { label: "Belinha", to: "/belinha", icon: Bot, type: "icon" as const },
            ].map((a) => {
              const IconComponent = a.type === "icon" ? a.icon as React.ComponentType<{ className?: string }> : null;
              return (
                <Link key={a.to} to={a.to}>
                  <motion.div whileHover={hoverLift} whileTap={tapDown} className="group flex flex-col items-center gap-1.5 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-all cursor-pointer">
                    {a.type === "emoji" ? (
                      <span className="text-lg emoji-fix">{a.icon as string}</span>
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

        {/* Meus Cursos (inscritos) */}
        {cursos.filter(c => enrolledIds.has(c.id)).length > 0 && (
          <motion.div variants={item} className="space-y-4">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">Meus Cursos</p>
            <div className="flex flex-col gap-3">
              {cursos.filter(c => enrolledIds.has(c.id)).map((curso) => {
                const pct = (curso.total_topicos || 0) > 0 ? ((curso.completed_topicos || 0) / (curso.total_topicos || 1)) * 100 : 0;
                const isComplete = pct === 100;
                return (
                  <Link key={curso.id} to={`/curso/${curso.id}`} className="block">
                    <motion.div
                      whileHover={hoverLift}
                      whileTap={tapDown}
                      className="group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isComplete ? "bg-primary/15" : "bg-secondary"} transition-colors`}>
                          {isComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <span className="text-base emoji-fix">📚</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-mono text-sm font-medium truncate">{curso.nome}</p>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <SegmentProgress value={pct} segments={5} className="flex-1" />
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0 tabular-nums">
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 font-mono mt-1.5">
                        {curso.modulos_count || 0} módulos · {curso.completed_topicos || 0}/{curso.total_topicos || 0} tópicos
                      </p>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Cursos Disponíveis (não inscritos) */}
        <motion.div variants={item} className="space-y-4">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
            {cursos.filter(c => enrolledIds.has(c.id)).length > 0 ? "Explorar Cursos" : "Cursos"}
          </p>
          {cursos.filter(c => !enrolledIds.has(c.id)).length === 0 && cursos.filter(c => enrolledIds.has(c.id)).length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum curso cadastrado.</p>
          ) : cursos.filter(c => !enrolledIds.has(c.id)).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Você já está inscrito em todos os cursos!</p>
          ) : (
            <div className="flex flex-col gap-3">
              {cursos.filter(c => !enrolledIds.has(c.id)).map((curso) => (
                <Link key={curso.id} to={`/curso/${curso.id}`} className="block">
                  <motion.div
                    whileHover={hoverLift}
                    whileTap={tapDown}
                    className="group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary transition-colors">
                        <span className="text-base emoji-fix">📚</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-mono text-sm font-medium truncate">{curso.nome}</p>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 font-mono mt-2">
                      {curso.modulos_count || 0} módulos · {curso.total_topicos || 0} tópicos
                    </p>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>

      {/* Chat Flutuante */}
      <AnimatePresence>
        {chatAberto && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50"
          >
            <div className="h-full w-full bg-background/95 backdrop-blur-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/20">
                <div className="flex items-center gap-2.5">
                  {adminConfig.avatar_url ? (
                    <img src={adminConfig.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-border/30" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Code className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-foreground">{adminConfig.nome}</span>
                  {naoLidas > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground">
                      {naoLidas}
                    </span>
                  )}
                </div>
                <button
                  className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-secondary/50 transition-all"
                  onClick={() => setChatAberto(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 px-4 py-3" onClick={() => setLongPressMsg(null)}>
                      <div className="space-y-2.5">
                        {mensagens.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                              <Code className="h-4 w-4 text-muted-foreground/30" />
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
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



    </Layout>
  );
};

export default Index;
