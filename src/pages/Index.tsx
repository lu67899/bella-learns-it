import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, BrainCircuit, CalendarDays, StickyNote, Sparkles, GraduationCap, MessageCircle, Send, X, Play, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
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

interface Modulo {
  materia: string;
  resumos: number;
  flashcards: number;
  tarefas: number;
  concluidas: number;
}

interface Mensagem {
  id: string;
  remetente: string;
  conteudo: string;
  created_at: string;
}

const Index = () => {
  const [stats, setStats] = useState({ resumos: 0, flashcards: 0, tarefas: 0, tarefasConcluidas: 0 });
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [chatAberto, setChatAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [rRes, fRes, cRes, rAll, fAll, mRes, cAll] = await Promise.all([
        supabase.from("resumos").select("id", { count: "exact", head: true }),
        supabase.from("flashcards").select("id", { count: "exact", head: true }),
        supabase.from("cronograma").select("id, concluida"),
        supabase.from("resumos").select("materia"),
        supabase.from("flashcards").select("materia"),
        supabase.from("mensagens").select("*").order("created_at", { ascending: true }),
        supabase.from("cronograma").select("materia, concluida"),
      ]);

      const tarefas = cRes.data || [];
      setStats({
        resumos: rRes.count || 0,
        flashcards: fRes.count || 0,
        tarefas: tarefas.length,
        tarefasConcluidas: tarefas.filter((t: any) => t.concluida).length,
      });

      const materiaMap = new Map<string, { resumos: number; flashcards: number; tarefas: number; concluidas: number }>();
      const ensure = (mat: string) => {
        if (!materiaMap.has(mat)) materiaMap.set(mat, { resumos: 0, flashcards: 0, tarefas: 0, concluidas: 0 });
        return materiaMap.get(mat)!;
      };
      (rAll.data || []).forEach((r: any) => { ensure(r.materia).resumos++; });
      (fAll.data || []).forEach((f: any) => { ensure(f.materia).flashcards++; });
      (cAll.data || []).forEach((c: any) => {
        ensure(c.materia).tarefas++;
        if (c.concluida) ensure(c.materia).concluidas++;
      });
      setModulos(Array.from(materiaMap.entries()).map(([materia, counts]) => ({ materia, ...counts })));

      if (mRes.data) {
        setMensagens(mRes.data);
        setNaoLidas(mRes.data.filter((m: any) => m.remetente === "admin" && !m.lida).length);
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
    // Mark admin messages as read
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

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8">
        {/* Greeting */}
        <motion.div variants={item} className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse-glow" />
            <p className="text-sm text-muted-foreground font-mono">{saudacao}</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-mono">
            Olá, <span className="text-gradient">Bella</span>! 👩‍💻
          </h1>
          <p className="text-muted-foreground">Pronta para mais um dia de estudos?</p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card border-border border-glow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.resumos}</p>
                <p className="text-xs text-muted-foreground">Resumos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-glow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
                <BrainCircuit className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.flashcards}</p>
                <p className="text-xs text-muted-foreground">Flashcards</p>
              </div>
            </CardContent>
          </Card>
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

        {/* Continuar aula + Módulos */}
        <motion.div variants={item} className="space-y-4">
          {/* Continuar aula banner */}
          {modulos.length > 0 && (() => {
            // Pick the module with most content as "last studied"
            const destaque = [...modulos].sort((a, b) => (b.resumos + b.flashcards) - (a.resumos + a.flashcards))[0];
            const total = destaque.resumos + destaque.flashcards + destaque.tarefas;
            const feito = destaque.concluidas;
            const progresso = destaque.tarefas > 0 ? Math.round((feito / destaque.tarefas) * 100) : 0;
            return (
              <Link to="/resumos">
                <Card className="bg-card border-border border-glow hover:glow-purple transition-all cursor-pointer group">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 group-hover:bg-primary/25 transition-colors">
                      <Play className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-mono">▶️ Continuar aula</p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="font-mono font-semibold text-sm truncate">{destaque.materia}</p>
                      <div className="space-y-1">
                        <Progress value={progresso} className="h-2" />
                        <p className="text-[11px] text-muted-foreground font-mono">{progresso}% concluído</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })()}

          <h2 className="text-lg font-mono font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" /> Módulos
          </h2>
          {modulos.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                Nenhuma matéria cadastrada ainda. Adicione resumos ou flashcards no painel admin.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {modulos.map((mod, i) => {
                const progresso = mod.tarefas > 0 ? Math.round((mod.concluidas / mod.tarefas) * 100) : 0;
                return (
                  <Link key={mod.materia} to="/resumos">
                    <Card className="bg-card border-border hover:border-primary/40 transition-all group cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-mono font-bold text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono font-semibold text-sm truncate">{mod.materia}</p>
                          <div className="flex gap-3 text-[11px] text-muted-foreground mt-1">
                            <span>{mod.resumos} resumos</span>
                            <span>·</span>
                            <span>{mod.flashcards} cards</span>
                            {mod.tarefas > 0 && (
                              <>
                                <span>·</span>
                                <span className="text-primary">{progresso}%</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
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
