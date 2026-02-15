import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, ChevronRight, Bell, CheckCircle2, Trophy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const [cursos, setCursos] = useState<CursoDB[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [chatAberto, setChatAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notifAberta, setNotifAberta] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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

      // Build module->topicos map
      const topicosByModule = new Map<string, string[]>();
      (topRes.data || []).forEach((t: any) => {
        const arr = topicosByModule.get(t.modulo_id) || [];
        arr.push(t.id);
        topicosByModule.set(t.modulo_id, arr);
      });

      const completedSet = new Set((progRes.data || []).map((p: any) => p.topico_id));

      // Build curso->modules map
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
  }, []);

  useEffect(() => {
    if (scrollRef.current && chatAberto) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensagens, chatAberto]);

  useEffect(() => {
    if (frases.length <= 1) return;
    const interval = setInterval(() => setFraseIdx((p) => (p + 1) % frases.length), 6000);
    return () => clearInterval(interval);
  }, [frases]);

  const abrirChat = async () => {
    setChatAberto(true);
    setNaoLidas(0);
    await supabase.from("mensagens").update({ lida: true }).eq("remetente", "admin").eq("lida", false);
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim()) return;
    const { data } = await supabase.from("mensagens").insert({ remetente: "bella", conteudo: novaMensagem.trim() }).select().single();
    if (data) setMensagens((prev) => [...prev, data]);
    setNovaMensagem("");
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

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-10 pb-20">

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
                    <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === fraseIdx ? "w-4 bg-primary/50" : "w-1 bg-muted"}`} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

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

        {/* Progress & Desafios - side by side */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <Link to="/progresso">
            <div className="group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Progresso</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-2xl font-bold font-mono text-gradient">{Math.round(overallProgress)}%</p>
              <Progress value={overallProgress} className="h-1 mt-3" />
            </div>
          </Link>
          <Link to="/desafios">
            <div className="group p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider flex items-center gap-1">
                  <Trophy className="h-3 w-3" /> Desafios
                </span>
                <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-2xl font-bold font-mono">
                <span className="text-gradient">{desafiosCount.respondidos}</span>
                <span className="text-muted-foreground text-sm">/{desafiosCount.total}</span>
              </p>
              <Progress value={desafiosCount.total > 0 ? (desafiosCount.respondidos / desafiosCount.total) * 100 : 0} className="h-1 mt-3" />
            </div>
          </Link>
        </motion.div>

        {/* Acesso Rápido */}
        <motion.div variants={item} className="space-y-3">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Acesso rápido</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Resumos", to: "/resumos", icon: "📖" },
              { label: "Flashcards", to: "/flashcards", icon: "🧠" },
              { label: "Cronograma", to: "/cronograma", icon: "📅" },
              { label: "Anotações", to: "/anotacoes", icon: "📝" },
            ].map((a) => (
              <Link key={a.to} to={a.to}>
                <div className="group flex flex-col items-center gap-1.5 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-all cursor-pointer">
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-[10px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">{a.label}</span>
                </div>
              </Link>
            ))}
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
                    <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-all cursor-pointer">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-mono font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        {pct === 100 ? <CheckCircle2 className="h-4 w-4 text-primary" /> : "📚"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">{curso.nome}</p>
                        {curso.descricao && <p className="text-xs text-muted-foreground truncate">{curso.descricao}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={pct} className="h-1 flex-1" />
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {curso.modulos_count || 0} módulos · {Math.round(pct)}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

      </motion.div>

      {/* Chat */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {chatAberto && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute bottom-14 right-0 w-80">
              <Card className="bg-card border-border shadow-2xl">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <span className="font-mono text-xs font-semibold flex items-center gap-1.5"><MessageCircle className="h-3 w-3 text-accent" />Chat</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setChatAberto(false)}><X className="h-3 w-3" /></Button>
                </div>
                <ScrollArea className="h-64 p-3" ref={scrollRef}>
                  <div className="space-y-2">
                    {mensagens.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Diga oi! 👋</p>}
                    {mensagens.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.remetente === "bella" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-xl px-3 py-1.5 text-xs ${msg.remetente === "bella" ? "bg-primary/20 rounded-br-sm" : "bg-secondary rounded-bl-sm"}`}>
                          <p>{msg.conteudo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2 p-2 border-t border-border">
                  <Input placeholder="Mensagem..." value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarMensagem()} className="flex-1 h-8 text-xs" />
                  <Button size="icon" className="h-8 w-8" onClick={enviarMensagem} disabled={!novaMensagem.trim()}><Send className="h-3 w-3" /></Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <Button onClick={chatAberto ? () => setChatAberto(false) : abrirChat} size="icon" className="h-12 w-12 rounded-full shadow-lg relative" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
          {chatAberto ? <X className="h-5 w-5 text-white" /> : <MessageCircle className="h-5 w-5 text-white" />}
          {!chatAberto && naoLidas > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">{naoLidas}</span>
          )}
        </Button>
      </div>
    </Layout>
  );
};

export default Index;
