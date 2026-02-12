import { motion } from "framer-motion";
import { BookOpen, BrainCircuit, CalendarDays, StickyNote, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Layout } from "@/components/Layout";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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
  const [quizScores] = useLocalStorage<Record<string, number[]>>("bella-quiz-scores", {});
  const [cronograma] = useLocalStorage<any[]>("bella-cronograma", []);

  const totalQuizzes = Object.values(quizScores).flat().length;
  const avgScore = totalQuizzes > 0
    ? Math.round(Object.values(quizScores).flat().reduce((a, b) => a + b, 0) / totalQuizzes)
    : 0;

  const tarefasConcluidas = cronograma.filter((t: any) => t.concluida).length;
  const totalTarefas = cronograma.length;

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <Layout>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
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
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{totalQuizzes}</p>
                <p className="text-xs text-muted-foreground">Quizzes feitos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-glow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{avgScore}%</p>
                <p className="text-xs text-muted-foreground">Média de acertos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border border-glow">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tarefas da semana</span>
                <span className="font-mono text-primary">{tarefasConcluidas}/{totalTarefas}</span>
              </div>
              <Progress value={totalTarefas > 0 ? (tarefasConcluidas / totalTarefas) * 100 : 0} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links */}
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
