import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, RotateCcw, ChevronRight, Trophy, X, Check, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const { toast } = useToast();

  // Quiz state
  const [quizAtivo, setQuizAtivo] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizRespostas, setQuizRespostas] = useState<(number | null)[]>([]);
  const [quizMostrarResultado, setQuizMostrarResultado] = useState(false);
  const [quizSelecionada, setQuizSelecionada] = useState<number | null>(null);

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
    setCardIndex((prev) => (prev + 1) % filtrados.length);
  };

  const iniciarQuiz = () => {
    setQuizAtivo(true);
    setQuizIndex(0);
    setQuizRespostas([]);
    setQuizMostrarResultado(false);
    setQuizSelecionada(null);
  };

  const responderQuiz = (idx: number) => {
    setQuizSelecionada(idx);
    const novasRespostas = [...quizRespostas, idx];
    setQuizRespostas(novasRespostas);

    setTimeout(() => {
      if (quizIndex + 1 < quizFiltradas.length) {
        setQuizIndex((prev) => prev + 1);
        setQuizSelecionada(null);
      } else {
        setQuizMostrarResultado(true);
      }
    }, 1000);
  };

  const quizAcertos = useMemo(() => {
    if (!quizMostrarResultado) return 0;
    return quizRespostas.filter((r, i) => r === quizFiltradas[i].correta).length;
  }, [quizMostrarResultado, quizRespostas, quizFiltradas]);

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
                <p className="text-sm text-muted-foreground font-mono">{cardIndex + 1} / {filtrados.length}</p>
                <div className="w-full max-w-md cursor-pointer perspective-1000" onClick={() => setFlipped(!flipped)}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${filtrados[cardIndex]?.id}-${flipped}`}
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className={`min-h-[220px] flex items-center justify-center border-glow ${flipped ? "glow-cyan" : "glow-purple"}`}>
                        <CardContent className="p-8 text-center">
                          <Badge variant="outline" className="mb-4 text-[10px]">{flipped ? "Resposta" : "Pergunta"}</Badge>
                          <p className="text-lg font-medium">{flipped ? filtrados[cardIndex]?.resposta : filtrados[cardIndex]?.pergunta}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setFlipped(!flipped)} className="gap-2"><RotateCcw className="h-4 w-4" /> Virar</Button>
                  <Button onClick={nextCard} className="gap-2">Próximo <ChevronRight className="h-4 w-4" /></Button>
                </div>
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
              <div className="text-center py-12 space-y-4">
                <Trophy className="h-12 w-12 mx-auto text-primary animate-pulse-glow" />
                <h3 className="font-mono font-semibold text-lg">Pronta para o Quiz?</h3>
                <p className="text-sm text-muted-foreground">{quizFiltradas.length} perguntas disponíveis</p>
                <Button onClick={iniciarQuiz}>Começar Quiz</Button>
              </div>
            ) : quizMostrarResultado ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12 space-y-4">
                <Trophy className="h-16 w-16 mx-auto text-primary" />
                <h3 className="font-mono font-bold text-2xl">{quizAcertos}/{quizFiltradas.length} acertos!</h3>
                <p className="text-muted-foreground">{Math.round((quizAcertos / quizFiltradas.length) * 100)}% de aproveitamento</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setQuizAtivo(false)}>Voltar</Button>
                  <Button onClick={iniciarQuiz}>Tentar novamente</Button>
                </div>
              </motion.div>
            ) : (
              <div className="max-w-lg mx-auto space-y-6">
                <p className="text-sm text-muted-foreground font-mono">{quizIndex + 1} / {quizFiltradas.length}</p>
                <Card className="border-glow">
                  <CardContent className="p-6 space-y-6">
                    <p className="font-medium text-lg">{quizFiltradas[quizIndex]?.pergunta}</p>
                    <div className="space-y-3">
                      {quizFiltradas[quizIndex]?.opcoes.map((op, i) => {
                        const respondida = quizSelecionada !== null;
                        const correta = quizFiltradas[quizIndex].correta === i;
                        const selecionada = quizSelecionada === i;
                        return (
                          <Button
                            key={i}
                            variant="outline"
                            className={`w-full justify-start text-left h-auto py-3 ${respondida && correta ? "border-neon-green text-neon-green" : ""} ${respondida && selecionada && !correta ? "border-destructive text-destructive" : ""}`}
                            disabled={respondida}
                            onClick={() => responderQuiz(i)}
                          >
                            {respondida && correta && <Check className="h-4 w-4 mr-2 shrink-0" />}
                            {respondida && selecionada && !correta && <X className="h-4 w-4 mr-2 shrink-0" />}
                            {op}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Flashcards;
