import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, RotateCcw, ChevronRight, Trophy, X, Check, Loader2, ArrowLeft, Timer } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizQuestion {
  id: string;
  materia: string;
  pergunta: string;
  opcoes: string[];
  correta: number;
}

const TIMER_SECONDS = 30;

const Quiz = () => {
  const navigate = useNavigate();
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [materias, setMaterias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [materiaFiltro, setMateriaFiltro] = useState<string>("todas");
  const { toast } = useToast();

  // Quiz state
  const [quizAtivo, setQuizAtivo] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizRespostas, setQuizRespostas] = useState<(number | null)[]>([]);
  const [quizMostrarResultado, setQuizMostrarResultado] = useState(false);
  const [quizSelecionada, setQuizSelecionada] = useState<number | null>(null);
  const [quizRespondida, setQuizRespondida] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    const fetchData = async () => {
      const [questionsRes, materiasRes] = await Promise.all([
        supabase.from("quiz_questions").select("*").order("created_at", { ascending: false }),
        supabase.from("materias").select("nome").order("nome"),
      ]);
      if (questionsRes.error) {
        toast({ title: "Erro ao carregar dados", variant: "destructive" });
      }
      setQuizQuestions(questionsRes.data || []);
      setMaterias((materiasRes.data || []).map((m) => m.nome));
      setLoading(false);
    };
    fetchData();
  }, []);

  // Handle timer reaching 0 — auto-submit as wrong (null)
  useEffect(() => {
    if (quizAtivo && !quizRespondida && timeLeft === 0) {
      setQuizRespondida(true);
      setQuizSelecionada(null);
      setQuizRespostas((prev) => [...prev, null]);
    }
  }, [timeLeft, quizAtivo, quizRespondida]);

  // Start timer when a new question appears
  useEffect(() => {
    if (quizAtivo && !quizRespondida && !quizMostrarResultado) {
      startTimer();
    }
    return () => clearTimer();
  }, [quizIndex, quizAtivo, quizMostrarResultado]);

  // Stop timer when answered
  useEffect(() => {
    if (quizRespondida) {
      clearTimer();
    }
  }, [quizRespondida, clearTimer]);

  const quizFiltradas = quizQuestions.filter((q) => materiaFiltro === "todas" || q.materia === materiaFiltro);

  const iniciarQuiz = () => {
    setQuizAtivo(true);
    setQuizIndex(0);
    setQuizRespostas([]);
    setQuizMostrarResultado(false);
    setQuizSelecionada(null);
    setQuizRespondida(false);
  };

  const responderQuiz = (idx: number) => {
    if (quizRespondida) return;
    setQuizSelecionada(idx);
    setQuizRespondida(true);
    setQuizRespostas((prev) => [...prev, idx]);
  };

  const proximaQuestao = () => {
    if (quizIndex + 1 < quizFiltradas.length) {
      setQuizIndex((prev) => prev + 1);
      setQuizSelecionada(null);
      setQuizRespondida(false);
    } else {
      setQuizMostrarResultado(true);
    }
  };

  const quizAcertos = useMemo(() => {
    if (!quizMostrarResultado) return 0;
    return quizRespostas.filter((r, i) => r === quizFiltradas[i]?.correta).length;
  }, [quizMostrarResultado, quizRespostas, quizFiltradas]);

  const quizPercentual = quizFiltradas.length > 0 ? Math.round((quizAcertos / quizFiltradas.length) * 100) : 0;

  const timerColor = timeLeft <= 5 ? "text-destructive" : timeLeft <= 10 ? "text-amber-500" : "text-muted-foreground";
  const timerProgress = (timeLeft / TIMER_SECONDS) * 100;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-sm mx-auto space-y-5">
        <div className="mb-5">
          <BackButton to="/jogos" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-mono font-bold flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-accent" /> Quiz
            </h1>
            <p className="text-xs text-muted-foreground">Teste seus conhecimentos</p>
          </div>
          <Select value={materiaFiltro} onValueChange={(v) => { setMateriaFiltro(v); setQuizAtivo(false); clearTimer(); }}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {quizFiltradas.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma questão de quiz cadastrada</p>
            <p className="text-xs text-muted-foreground/60">Adicione questões pelo painel admin</p>
          </div>
        ) : !quizAtivo ? (
          <div className="text-center py-12 space-y-6">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-2xl bg-primary/15 glow-purple">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-mono font-semibold text-xl">Pronta para o Quiz?</h3>
              <p className="text-sm text-muted-foreground">{quizFiltradas.length} perguntas disponíveis</p>
              <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1">
                <Timer className="h-3 w-3" /> {TIMER_SECONDS}s por questão
              </p>
            </div>
            <Button onClick={iniciarQuiz} size="lg" className="gap-2">
              <BrainCircuit className="h-5 w-5" /> Começar Quiz
            </Button>
          </div>
        ) : quizMostrarResultado ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8">
            <div className="text-center space-y-4">
              <div className={`flex h-20 w-20 mx-auto items-center justify-center rounded-2xl ${quizPercentual >= 70 ? "bg-neon-green/15" : quizPercentual >= 40 ? "bg-accent/15" : "bg-destructive/15"}`}>
                <Trophy className={`h-10 w-10 ${quizPercentual >= 70 ? "text-neon-green" : quizPercentual >= 40 ? "text-accent" : "text-destructive"}`} />
              </div>
              <h3 className="font-mono font-bold text-3xl">{quizAcertos}/{quizFiltradas.length}</h3>
              <p className="text-muted-foreground text-lg">{quizPercentual}% de aproveitamento</p>
              <Progress value={quizPercentual} className="h-3 max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground">
                {quizPercentual >= 70 ? "🎉 Excelente! Continue assim!" : quizPercentual >= 40 ? "💪 Bom trabalho! Pode melhorar!" : "📚 Revise o conteúdo e tente novamente!"}
              </p>
            </div>

            {/* Review answers */}
            <div className="space-y-3 max-w-lg mx-auto">
              <h4 className="font-mono font-semibold text-sm text-muted-foreground">Revisão das respostas</h4>
              {quizFiltradas.map((q, i) => {
                const acertou = quizRespostas[i] === q.correta;
                const tempoEsgotado = quizRespostas[i] === null;
                return (
                  <Card key={q.id} className={`border ${acertou ? "border-neon-green/30" : "border-destructive/30"}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${acertou ? "bg-neon-green/20 text-neon-green" : "bg-destructive/20 text-destructive"}`}>
                          {acertou ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </div>
                        <p className="text-sm font-medium">{q.pergunta}</p>
                      </div>
                      {!acertou && (
                        <p className="text-xs text-muted-foreground ml-8">
                          {tempoEsgotado ? (
                            <span className="text-destructive">⏰ Tempo esgotado</span>
                          ) : (
                            <>Sua resposta: <span className="text-destructive">{q.opcoes[quizRespostas[i]!]}</span></>
                          )}
                          {" · "}Correta: <span className="text-neon-green">{q.opcoes[q.correta]}</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => { setQuizAtivo(false); clearTimer(); }} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button onClick={iniciarQuiz} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Tentar novamente
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="max-w-lg mx-auto space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="font-mono">Questão {quizIndex + 1} de {quizFiltradas.length}</span>
                <span className="font-mono">{Math.round(((quizIndex) / quizFiltradas.length) * 100)}%</span>
              </div>
              <Progress value={(quizIndex / quizFiltradas.length) * 100} className="h-2" />
            </div>

            {/* Timer */}
            <div className="space-y-1">
              <div className={`flex items-center justify-center gap-1.5 font-mono text-sm font-bold ${timerColor} transition-colors`}>
                <Timer className="h-4 w-4" />
                <span>{timeLeft}s</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full transition-colors ${
                    timeLeft <= 5 ? "bg-destructive" : timeLeft <= 10 ? "bg-amber-500" : "bg-primary"
                  }`}
                  initial={false}
                  animate={{ width: `${timerProgress}%` }}
                  transition={{ duration: 0.3, ease: "linear" }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={quizIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="border-glow">
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-[10px] font-mono">{quizFiltradas[quizIndex]?.materia}</Badge>
                      <p className="font-medium text-lg leading-relaxed">{quizFiltradas[quizIndex]?.pergunta}</p>
                    </div>
                    <div className="space-y-3">
                      {quizFiltradas[quizIndex]?.opcoes.map((op, i) => {
                        const correta = quizFiltradas[quizIndex].correta === i;
                        const selecionada = quizSelecionada === i;
                        let className = "w-full justify-start text-left h-auto py-3 px-4 gap-3 transition-all";

                        if (quizRespondida) {
                          if (correta) {
                            className += " border-neon-green/60 bg-neon-green/10 text-neon-green";
                          } else if (selecionada && !correta) {
                            className += " border-destructive/60 bg-destructive/10 text-destructive";
                          } else {
                            className += " opacity-50";
                          }
                        } else {
                          className += " hover:border-primary/40 hover:bg-primary/5";
                        }

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Button
                              variant="outline"
                              className={className}
                              disabled={quizRespondida && !correta && !selecionada}
                              onClick={() => responderQuiz(i)}
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-mono">
                                {quizRespondida && correta ? <Check className="h-3 w-3" /> : quizRespondida && selecionada && !correta ? <X className="h-3 w-3" /> : String.fromCharCode(65 + i)}
                              </span>
                              <span className="text-sm">{op}</span>
                            </Button>
                          </motion.div>
                        );
                      })}
                    </div>

                    {quizRespondida && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-2"
                      >
                        <Button onClick={proximaQuestao} className="w-full gap-2">
                          {quizIndex + 1 < quizFiltradas.length ? (
                            <>Próxima questão <ChevronRight className="h-4 w-4" /></>
                          ) : (
                            <>Ver resultado <Trophy className="h-4 w-4" /></>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Question dots */}
            <div className="flex justify-center gap-1.5 flex-wrap">
              {quizFiltradas.map((_, i) => {
                const respondida = i < quizRespostas.length;
                const acertou = respondida && quizRespostas[i] === quizFiltradas[i]?.correta;
                const atual = i === quizIndex;
                return (
                  <div
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      atual ? "bg-primary scale-125" :
                      respondida && acertou ? "bg-neon-green" :
                      respondida ? "bg-destructive" :
                      "bg-muted"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Quiz;
