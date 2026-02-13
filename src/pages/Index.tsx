import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, BrainCircuit, CalendarDays, StickyNote, Sparkles, GraduationCap, MessageCircle, Send, X, ChevronRight, Bell, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

const quickLinks = [
  { title: "Resumos", desc: "Revisar matérias", icon: BookOpen, url: "/resumos", color: "text-neon-purple" },
  { title: "Flashcards", desc: "Praticar questões", icon: BrainCircuit, url: "/flashcards", color: "text-neon-cyan" },
  { title: "Cronograma", desc: "Planejar estudos", icon: CalendarDays, url: "/cronograma", color: "text-neon-pink" },
  { title: "Anotações", desc: "Suas notas", icon: StickyNote, url: "/anotacoes", color: "text-neon-green" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface ModuloDB {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  topicos_count?: number;
  completed_count?: number;
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
  const [stats, setStats] = useState({ resumos: 0, flashcards: 0, tarefas: 0, tarefasConcluidas: 0 });
  const [modulos, setModulos] = useState<ModuloDB[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [chatAberto, setChatAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notifAberta, setNotifAberta] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      const [rRes, fRes, cRes, modRes, topRes, mRes, progRes, notifRes] = await Promise.all([
        supabase.from("resumos").select("id", { count: "exact", head: true }),
        supabase.from("flashcards").select("id", { count: "exact", head: true }),
        supabase.from("cronograma").select("id, concluida"),
        supabase.from("modulos").select("*").order("ordem"),
        supabase.from("modulo_topicos").select("modulo_id, id"),
        supabase.from("mensagens").select("*").order("created_at", { ascending: true }),
        supabase.from("topico_progresso").select("topico_id"),
        supabase.from("notificacoes").select("*").order("created_at", { ascending: false }).limit(20),
      ]);

      const tarefas = cRes.data || [];
      setStats({
        resumos: rRes.count || 0,
        flashcards: fRes.count || 0,
        tarefas: tarefas.length,
        tarefasConcluidas: tarefas.filter((t: any) => t.concluida).length,
      });

      // Build progress per module
      const topicosByModule = new Map<string, string[]>();
      (topRes.data || []).forEach((t: any) => {
        const arr = topicosByModule.get(t.modulo_id) || [];
        arr.push(t.id);
        topicosByModule.set(t.modulo_id, arr);
      });

      const completedSet = new Set((progRes.data || []).map((p: any) => p.topico_id));

      const mods = (modRes.data || []).map((m: any) => {
        const topicIds = topicosByModule.get(m.id) || [];
        return {
          ...m,
          topicos_count: topicIds.length,
          completed_count: topicIds.filter((id) => completedSet.has(id)).length,
        };
      });
      setModulos(mods);

      // Overall progress
      const totalTopics = Array.from(topicosByModule.values()).flat().length;
      setOverallProgress(totalTopics > 0 ? (completedSet.size / totalTopics) * 100 : 0);

      if (mRes.data) {
        setMensagens(mRes.data);
        setNaoLidas(mRes.data.filter((m: any) => m.remetente === "admin" && !m.lida).length);
      }

      if (notifRes.data) {
        setNotificacoes(notifRes.data);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (scrollRef.current && chatAberto) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens, chatAberto]);

  const abrirChat = async () => {
    setChatAberto(true);
    setNaoLidas(0);
    await supabase.from("mensagens").update({ lida: true }).eq("remetente", "admin").eq("lida", false);
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;
    const { data } = await supabase
      .from("mensagens")
      .insert({ remetente: "bella", conteudo: novaMensagem.trim() })
      .select()
      .single();
    if (data) setMensagens((prev) => [...prev, data]);
    setNovaMensagem("");
  };

  const marcarNotifLida = async (notif: Notificacao) => {
    if (!notif.lida) {
      await supabase.from("notificacoes").update({ lida: true }).eq("id", notif.id);
      setNotificacoes((prev) => prev.map((n) => (n.id === notif.id ? { ...n, lida: true } : n)));
    }
    if (notif.link) {
      setNotifAberta(false);
      navigate(notif.link);
    }
  };

  const notifNaoLidas = notificacoes.filter((n) => !n.lida).length;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8">
        {/* Greeting */}
        <motion.div variants={item} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse-glow" />
              <p className="text-sm text-muted-foreground font-mono">{saudacao}</p>
            </div>
            {/* Notification Bell */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setNotifAberta(!notifAberta)}>
                <Bell className="h-5 w-5" />
                {notifNaoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {notifNaoLidas}
                  </span>
                )}
              </Button>
              <AnimatePresence>
                {notifAberta && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-12 w-80 z-50"
                  >
                    <Card className="bg-card border-border shadow-2xl">
                      <div className="flex items-center justify-between p-3 border-b border-border">
                        <h3 className="font-mono font-semibold text-sm">Notificações</h3>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setNotifAberta(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <ScrollArea className="max-h-64">
                        {notificacoes.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação</p>
                        ) : (
                          <div className="divide-y divide-border">
                            {notificacoes.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => marcarNotifLida(n)}
                                className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors ${!n.lida ? "bg-primary/5" : ""}`}
                              >
                                <p className={`text-sm font-mono ${!n.lida ? "font-semibold" : ""}`}>{n.titulo}</p>
                                {n.mensagem && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.mensagem}</p>}
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {new Date(n.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                </p>
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
          <h1 className="text-3xl md:text-4xl font-bold font-mono">
            Olá, <span className="text-gradient">Bella</span>! 👩‍💻
          </h1>
          <p className="text-muted-foreground">Pronta para mais um dia de estudos?</p>
        </motion.div>

        {/* Overall Progress */}
        <motion.div variants={item}>
          <Card className="bg-card border-border border-glow">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-mono">Progresso Geral dos Módulos</span>
                <span className="font-mono text-primary">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item}>
          <Card className="bg-card border-border border-glow">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tarefas da semana</span>
                <span className="font-mono text-primary">{stats.tarefasConcluidas}/{stats.tarefas}</span>
              </div>
              <Progress value={stats.tarefas > 0 ? (stats.tarefasConcluidas / stats.tarefas) * 100 : 0} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Módulos */}
        <motion.div variants={item} className="space-y-4">
          <h2 className="text-lg font-mono font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" /> Módulos
          </h2>
          {modulos.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Nenhum módulo cadastrado ainda. Adicione módulos no painel admin.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {modulos.map((mod, i) => {
                const modProgress = (mod.topicos_count || 0) > 0 ? ((mod.completed_count || 0) / (mod.topicos_count || 1)) * 100 : 0;
                return (
                  <Link key={mod.id} to={`/modulo/${mod.id}`}>
                    <Card className="bg-card border-border hover:border-primary/40 transition-all group cursor-pointer">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-mono font-bold text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                            {modProgress === 100 ? <CheckCircle2 className="h-5 w-5 text-primary" /> : i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono font-semibold text-sm truncate">{mod.nome}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {mod.completed_count || 0}/{mod.topicos_count || 0} tópicos concluídos
                              {mod.descricao && ` · ${mod.descricao}`}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-primary shrink-0">{Math.round(modProgress)}%</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                        </div>
                        <Progress value={modProgress} className="h-1.5" />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Acesso Rápido */}
        <motion.div variants={item}>
          <h2 className="text-lg font-mono font-semibold mb-4">Acesso Rápido</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.title} to={link.url}>
                <Card className="bg-card border-border hover:border-primary/40 transition-all hover:glow-purple group cursor-pointer h-full">
                  <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary group-hover:bg-primary/15 transition-colors">
                      <link.icon className={`h-6 w-6 ${link.color} transition-transform group-hover:scale-110`} />
                    </div>
                    <div>
                      <p className="font-mono font-semibold text-sm">{link.title}</p>
                      <p className="text-[11px] text-muted-foreground">{link.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatAberto && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 w-80 sm:w-96"
            >
              <Card className="bg-card border-border border-glow shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="font-mono font-semibold text-sm flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-accent" /> Chat
                  </h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setChatAberto(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-72 p-4" ref={scrollRef}>
                  <div className="space-y-3">
                    {mensagens.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem ainda. Diga oi! 👋</p>
                    )}
                    {mensagens.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.remetente === "bella" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                            msg.remetente === "bella"
                              ? "bg-primary/20 text-foreground rounded-br-md"
                              : "bg-secondary text-foreground rounded-bl-md"
                          }`}
                        >
                          <p>{msg.conteudo}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(msg.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2 p-3 border-t border-border">
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && enviarMensagem()}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button size="icon" className="h-9 w-9" onClick={enviarMensagem} disabled={!novaMensagem.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={chatAberto ? () => setChatAberto(false) : abrirChat}
          size="icon"
          className="h-14 w-14 rounded-full glow-purple shadow-lg relative"
        >
          {chatAberto ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          {!chatAberto && naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {naoLidas}
            </span>
          )}
        </Button>
      </div>
    </Layout>
  );
};

export default Index;
