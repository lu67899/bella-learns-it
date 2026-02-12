import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, RotateCcw, Plus, ChevronRight, Trophy, X, Check } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { flashcardsIniciais, quizQuestionsIniciais, type Flashcard } from "@/data/flashcards";
import { materias } from "@/data/resumos";

const Flashcards = () => {
  const [flashcards, setFlashcards] = useLocalStorage<Flashcard[]>("bella-flashcards", flashcardsIniciais);
  const [quizScores, setQuizScores] = useLocalStorage<Record<string, number[]>>("bella-quiz-scores", {});
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [materiaFiltro, setMateriaFiltro] = useState<string>("todas");
  const [dialogAberto, setDialogAberto] = useState(false);
  const [form, setForm] = useState({ materia: "", pergunta: "", resposta: "" });

  // Quiz state
  const [quizAtivo, setQuizAtivo] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizRespostas, setQuizRespostas] = useState<(number | null)[]>([]);
  const [quizMostrarResultado, setQuizMostrarResultado] = useState(false);
  const [quizSelecionada, setQuizSelecionada] = useState<number | null>(null);

  const filtrados = flashcards.filter((f) => materiaFiltro === "todas" || f.materia === materiaFiltro);
  const quizQuestions = quizQuestionsIniciais.filter((q) => materiaFiltro === "todas" || q.materia === materiaFiltro);

  const salvarFlashcard = () => {
    if (!form.materia || !form.pergunta || !form.resposta) return;
    setFlashcards((prev) => [...prev, { id: `f-${Date.now()}`, ...form, isCustom: true }]);
    setForm({ materia: "", pergunta: "", resposta: "" });
    setDialogAberto(false);
  };

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
      if (quizIndex + 1 < quizQuestions.length) {
        setQuizIndex((prev) => prev + 1);
        setQuizSelecionada(null);
      } else {
        const acertos = novasRespostas.filter((r, i) => r === quizQuestions[i].correta).length;
        const pct = Math.round((acertos / quizQuestions.length) * 100);
        const key = materiaFiltro === "todas" ? "geral" : materiaFiltro;
        setQuizScores((prev) => ({ ...prev, [key]: [...(prev[key] || []), pct] }));
        setQuizMostrarResultado(true);
      }
    }, 1000);
  };

  const quizAcertos = useMemo(() => {
    if (!quizMostrarResultado) return 0;
    return quizRespostas.filter((r, i) => r === quizQuestions[i].correta).length;
  }, [quizMostrarResultado, quizRespostas, quizQuestions]);

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
          <div className="flex gap-2">
            <Select value={materiaFiltro} onValueChange={(v) => { setMateriaFiltro(v); setCardIndex(0); setFlipped(false); }}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild><Button size="icon"><Plus className="h-4 w-4" /></Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-mono">Novo Flashcard</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <Select value={form.materia} onValueChange={(v) => setForm({ ...form, materia: v })}>
                    <SelectTrigger><SelectValue placeholder="Matéria" /></SelectTrigger>
                    <SelectContent>{materias.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Pergunta" value={form.pergunta} onChange={(e) => setForm({ ...form, pergunta: e.target.value })} />
                  <Textarea placeholder="Resposta" value={form.resposta} onChange={(e) => setForm({ ...form, resposta: e.target.value })} />
                  <Button onClick={salvarFlashcard} className="w-full">Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="flashcards">
          <TabsList className="bg-secondary">
            <TabsTrigger value="flashcards" className="font-mono text-xs">Flashcards</TabsTrigger>
            <TabsTrigger value="quiz" className="font-mono text-xs">Quiz</TabsTrigger>
          </TabsList>

          <TabsContent value="flashcards" className="mt-6">
            {filtrados.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Nenhum flashcard encontrado.</p>
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
            {!quizAtivo ? (
              <div className="text-center py-12 space-y-4">
                <Trophy className="h-12 w-12 mx-auto text-primary animate-pulse-glow" />
                <h3 className="font-mono font-semibold text-lg">Pronta para o Quiz?</h3>
                <p className="text-sm text-muted-foreground">{quizQuestions.length} perguntas disponíveis</p>
                <Button onClick={iniciarQuiz} disabled={quizQuestions.length === 0}>Começar Quiz</Button>
              </div>
            ) : quizMostrarResultado ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-12 space-y-4">
                <Trophy className="h-16 w-16 mx-auto text-primary" />
                <h3 className="font-mono font-bold text-2xl">{quizAcertos}/{quizQuestions.length} acertos!</h3>
                <p className="text-muted-foreground">{Math.round((quizAcertos / quizQuestions.length) * 100)}% de aproveitamento</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setQuizAtivo(false)}>Voltar</Button>
                  <Button onClick={iniciarQuiz}>Tentar novamente</Button>
                </div>
              </motion.div>
            ) : (
              <div className="max-w-lg mx-auto space-y-6">
                <p className="text-sm text-muted-foreground font-mono">{quizIndex + 1} / {quizQuestions.length}</p>
                <Card className="border-glow">
                  <CardContent className="p-6 space-y-6">
                    <p className="font-medium text-lg">{quizQuestions[quizIndex]?.pergunta}</p>
                    <div className="space-y-3">
                      {quizQuestions[quizIndex]?.opcoes.map((op, i) => {
                        const respondida = quizSelecionada !== null;
                        const correta = quizQuestions[quizIndex].correta === i;
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
