import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageCircle, Send, X, ChevronRight, Bell, CheckCircle2, Trophy, Minus, PlayCircle, Newspaper } from "lucide-react";
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

  useEffect(() => {
    const fetchAll = async () => {
      const [cursoRes, modRes, topRes, mRes, progRes, notifRes, desafiosRes, respostasRes, frasesRes] = await Promise.all([
        supabase.from("cursos").select("*").order("ordem"),
        supabase.from("modulos").select("id, curso_id"),
        supabase.from("modulo_topicos").select("modulo_id, id"),
        supabase.from("mensagens").select("*").order("created_at", { ascending: true }),
        supabase.from("topico_progresso").select("topico_id"),
        supabase.from("notificacoes").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("desafios_semanais").select("id"),
        supabase.from("desafio_respostas").select("desafio_id"),
        supabase.from("frases_motivacionais").select("texto").eq("ativa", true),
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
    };
    fetchAll();

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
    setNovaMensagem("");
    await supabase.from("mensagens").insert({ remetente: "bella", conteudo: novaMensagem.trim() }).select().single();
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
        <motion.div variants={item} className="flex items-start justify-between">
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
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: "Resumos", to: "/resumos", icon: "📖", type: "emoji" as const },
              { label: "Flashcards", to: "/flashcards", icon: "🧠", type: "emoji" as const },
              { label: "Cronograma", to: "/cronograma", icon: "📅", type: "emoji" as const },
              { label: "Anotações", to: "/anotacoes", icon: "📝", type: "emoji" as const },
              { label: "Mix", to: "/mix", icon: PlayCircle, type: "icon" as const },
              ...(features.newsEnabled ? [{ label: "Notícias", to: "/noticias", icon: Newspaper, type: "icon" as const }] : []),
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
      <div className="fixed bottom-20 right-6 z-50">
        <AnimatePresence>
          {chatAberto && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ transformOrigin: "bottom right" }}
            >
              <div className="w-80 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  onClick={() => setChatMinimizado(!chatMinimizado)}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-medium text-foreground/80">Mensagens</span>
                    {naoLidas > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                        {naoLidas}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); setChatMinimizado(!chatMinimizado); }}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); setChatAberto(false); }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Body */}
                <AnimatePresence>
                  {!chatMinimizado && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="h-px bg-border/30" />
                      <ScrollArea className="h-64 px-4 py-3">
                        <div className="space-y-3">
                          {mensagens.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                              <MessageCircle className="h-8 w-8 text-muted-foreground/20" />
                              <p className="text-[11px] text-muted-foreground/50">Nenhuma mensagem ainda</p>
                            </div>
                          )}
                          {mensagens.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.remetente === "bella" ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                  msg.remetente === "bella"
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-secondary/60 text-foreground rounded-bl-md"
                                }`}
                              >
                                {msg.conteudo}
                              </div>
                            </div>
                          ))}
                          <div ref={bottomRef} />
                        </div>
                      </ScrollArea>
                      <div className="p-3 pt-0">
                        <div className="flex gap-2 rounded-xl bg-secondary/40 p-1.5">
                          <Input
                            placeholder="Escreva uma mensagem..."
                            value={novaMensagem}
                            onChange={(e) => setNovaMensagem(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && enviarMensagem()}
                            className="flex-1 h-8 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40"
                          />
                          <Button
                            size="icon"
                            className="h-8 w-8 rounded-lg shrink-0"
                            onClick={enviarMensagem}
                            disabled={!novaMensagem.trim()}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatAberto && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={abrirChat}
            className="relative h-12 w-12 rounded-full shadow-lg shadow-primary/20 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
          >
            <MessageCircle className="h-5 w-5 text-white" />
            {naoLidas > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {naoLidas}
              </span>
            )}
          </motion.button>
        )}
      </div>
    </Layout>
  );
};

export default Index;
