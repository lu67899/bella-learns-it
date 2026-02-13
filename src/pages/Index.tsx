import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, BrainCircuit, CalendarDays, StickyNote, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

const Index = () => {
  const [stats, setStats] = useState({ resumos: 0, flashcards: 0, tarefas: 0, tarefasConcluidas: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [rRes, fRes, cRes] = await Promise.all([
        supabase.from("resumos").select("id", { count: "exact", head: true }),
        supabase.from("flashcards").select("id", { count: "exact", head: true }),
        supabase.from("cronograma").select("id, concluida"),
      ]);
      const tarefas = cRes.data || [];
      setStats({
        resumos: rRes.count || 0,
        flashcards: fRes.count || 0,
        tarefas: tarefas.length,
        tarefasConcluidas: tarefas.filter((t: any) => t.concluida).length,
      });
    };
    fetchStats();
  }, []);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8">
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
    </Layout>
  );
};

export default Index;
