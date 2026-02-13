import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, RotateCcw, ChevronRight, Trophy, X, Check, Loader2, ArrowLeft, CircleDot, Send } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Flashcard {
  id: string;
  materia: string;
  pergunta: string;
  resposta: string;
}

interface QuizQuestion {
  id: string;
  materia: string;
  pergunta: string;
  opcoes: string[];
  correta: number;
}

const Flashcards = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [materiaFiltro, setMateriaFiltro] = useState<string>("todas");
  const [respostaDigitada, setRespostaDigitada] = useState("");
  const [fcRespondido, setFcRespondido] = useState(false);
  const [fcAcertou, setFcAcertou] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Quiz state
  const [quizAtivo, setQuizAtivo] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizRespostas, setQuizRespostas] = useState<(number | null)[]>([]);
  const [quizMostrarResultado, setQuizMostrarResultado] = useState(false);
  const [quizSelecionada, setQuizSelecionada] = useState<number | null>(null);
  const [quizRespondida, setQuizRespondida] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [fcRes, quizRes] = await Promise.all([
        supabase.from("flashcards").select("*").order("created_at", { ascending: false }),
        supabase.from("quiz_questions").select("*").order("created_at", { ascending: false }),
      ]);
      if (fcRes.error || quizRes.error) {
        toast({ title: "Erro ao carregar dados", variant: "destructive" });
      }
      setFlashcards(fcRes.data || []);
      setQuizQuestions(quizRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const materias = [...new Set([...flashcards.map(f => f.materia), ...quizQuestions.map(q => q.materia)])];
  const filtrados = flashcards.filter((f) => materiaFiltro === "todas" || f.materia === materiaFiltro);
  const quizFiltradas = quizQuestions.filter((q) => materiaFiltro === "todas" || q.materia === materiaFiltro);

  const nextCard = () => {
    setFlipped(false);
    setRespostaDigitada("");
    setFcRespondido(false);
    setFcAcertou(null);
    setCardIndex((prev) => (prev + 1) % filtrados.length);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const verificarResposta = () => {
    if (!respostaDigitada.trim()) return;
    const correta = filtrados[cardIndex]?.resposta?.toLowerCase().trim() || "";
    const digitada = respostaDigitada.toLowerCase().trim();
    // Check if the answer contains the key words (flexible matching)
    const acertou = correta.includes(digitada) || digitada.includes(correta) || 
      correta.split(" ").filter(w => w.length > 3).some(word => digitada.includes(word));
    setFcAcertou(acertou);
    setFcRespondido(true);
    setFlipped(true);
  };

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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-accent" /> Flashcards & Quiz
            </h1>
            <p className="text-sm text-muted-foreground">Teste seus conhecimentos</p>
          </div>
          <Select value={materiaFiltro} onValueChange={(v) => { setMateriaFiltro(v); setCardIndex(0); setFlipped(false); }}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="flashcards">
          <TabsList className="bg-secondary">
            <TabsTrigger value="flashcards" className="font-mono text-xs">Flashcards</TabsTrigger>
            <TabsTrigger value="quiz" className="font-mono text-xs">Quiz</TabsTrigger>
          </TabsList>

          <TabsContent value="flashcards" className="mt-6">
            {filtrados.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhum flashcard cadastrado</p>
                <p className="text-xs text-muted-foreground/60">Adicione flashcards pelo painel admin</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {filtrados.map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 rounded-full transition-all ${
                        i === cardIndex ? "w-6 bg-primary" : "w-2 bg-muted"
                      }`}
                    />
                  ))}
                </div>

                {/* Pergunta */}
                <div className="w-full max-w-md">
                  <div className="relative min-h-[160px] flex flex-col items-center justify-center rounded-xl p-8 bg-primary/10 border border-primary/30">
                    <span className="absolute top-4 left-4 text-[10px] font-mono uppercase tracking-widest text-primary">
                      Pergunta
                    </span>
                    <span className="absolute top-4 right-4 text-[10px] font-mono text-muted-foreground">
                      {filtrados[cardIndex]?.materia}
                    </span>
                    <p className="text-lg font-medium text-center leading-relaxed">
                      {filtrados[cardIndex]?.pergunta}
                    </p>
                  </div>
                </div>

                {/* Campo de resposta */}
                <div className="w-full max-w-md space-y-3">
                  <form onSubmit={(e) => { e.preventDefault(); verificarResposta(); }} className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Digite sua resposta..."
                      value={respostaDigitada}
                      onChange={(e) => setRespostaDigitada(e.target.value)}
                      disabled={fcRespondido}
                      className={`flex-1 ${
                        fcRespondido && fcAcertou ? "border-accent/50" :
                        fcRespondido && !fcAcertou ? "border-destructive/50" : ""
                      }`}
                    />
                    {!fcRespondido ? (
                      <Button type="submit" size="icon" disabled={!respostaDigitada.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </form>

                  {/* Feedback */}
                  <AnimatePresence>
                    {fcRespondido && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <div className={`flex items-center gap-2 text-sm font-medium ${fcAcertou ? "text-accent" : "text-destructive"}`}>
                          {fcAcertou ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          {fcAcertou ? "Acertou! 🎉" : "Não foi dessa vez"}
                        </div>
                        <div className="rounded-xl p-5 bg-accent/10 border border-accent/30">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-accent block mb-2">
                            Resposta correta
                          </span>
                          <p className="text-sm leading-relaxed">{filtrados[cardIndex]?.resposta}</p>
                        </div>
                        <Button onClick={nextCard} className="w-full gap-2">
                          Próximo <ChevronRight className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Contador */}
                <span className="text-xs font-mono text-muted-foreground">{cardIndex + 1} de {filtrados.length}</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="quiz" className="mt-6">
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
                              Sua resposta: <span className="text-destructive">{q.opcoes[quizRespostas[i] ?? 0]}</span>
                              {" · "}Correta: <span className="text-neon-green">{q.opcoes[q.correta]}</span>
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setQuizAtivo(false)} className="gap-2">
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Flashcards;
