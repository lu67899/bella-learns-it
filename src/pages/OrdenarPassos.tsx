import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { RotateCcw, Loader2, Trophy, ArrowUp, ArrowDown, Check, ChevronRight } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Challenge {
  id: string;
  titulo: string;
  passos: string[];
  explicacao: string | null;
}

const OrdenarPassos = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userOrder, setUserOrder] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("ordenar_passos").select("id, titulo, passos, explicacao");
      if (data && data.length > 0) {
        const shuffled = shuffle(data);
        setChallenges(shuffled);
        setUserOrder(shuffle([...shuffled[0].passos]));
      }
      setLoading(false);
    };
    load();
  }, []);

  const current = challenges[currentIndex];
  const isCorrect = current && JSON.stringify(userOrder) === JSON.stringify(current.passos);
  const hasNext = currentIndex < challenges.length - 1;
  const gameOver = submitted && !hasNext;

  const moveItem = (index: number, direction: -1 | 1) => {
    if (submitted) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= userOrder.length) return;
    const newOrder = [...userOrder];
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];
    setUserOrder(newOrder);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTotal((t) => t + 1);
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (!hasNext) return;
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setUserOrder(shuffle([...challenges[nextIdx].passos]));
    setSubmitted(false);
  };

  const restart = () => {
    const shuffled = shuffle(challenges);
    setChallenges(shuffled);
    setCurrentIndex(0);
    setUserOrder(shuffle([...shuffled[0].passos]));
    setSubmitted(false);
    setScore(0);
    setTotal(0);
  };

  const getStepStatus = (step: string, index: number): "correct" | "wrong" | "neutral" => {
    if (!submitted) return "neutral";
    return current.passos[index] === step ? "correct" : "wrong";
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (challenges.length === 0) {
    return (
      <Layout>
        <div className="max-w-md mx-auto space-y-4 pb-20">
          <BackButton to="/jogos" />
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-mono">📋 Ordene os Passos</p>
            <p className="text-sm mt-2">Nenhum desafio cadastrado ainda.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto space-y-4 pb-20">
        <BackButton to="/jogos" />

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-mono font-bold">📋 Ordene os Passos</h1>
          <div className="flex gap-2 text-xs font-mono text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">
              {currentIndex + 1}/{challenges.length}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              ✓ {score}/{total}
            </Badge>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="pt-4 pb-3 space-y-3">
            <p className="text-sm font-mono font-medium text-center">{current.titulo}</p>
            <p className="text-[10px] text-muted-foreground text-center">
              Coloque os passos na ordem correta usando as setas
            </p>

            <div className="space-y-1.5">
              <AnimatePresence mode="popLayout">
                {userOrder.map((step, i) => {
                  const status = getStepStatus(step, i);
                  return (
                    <motion.div
                      key={step}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-colors ${
                        status === "correct"
                          ? "border-primary/40 bg-primary/5 text-primary"
                          : status === "wrong"
                          ? "border-destructive/40 bg-destructive/5 text-destructive"
                          : "border-border bg-muted/50"
                      }`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background border border-border text-[10px] font-mono font-bold">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-xs leading-tight">{step}</span>
                      {!submitted && (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveItem(i, -1)}
                            disabled={i === 0}
                            className="h-5 w-5 rounded flex items-center justify-center hover:bg-accent disabled:opacity-20 transition-colors"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => moveItem(i, 1)}
                            disabled={i === userOrder.length - 1}
                            className="h-5 w-5 rounded flex items-center justify-center hover:bg-accent disabled:opacity-20 transition-colors"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      {submitted && status === "correct" && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {!submitted ? (
              <Button onClick={handleSubmit} className="w-full gap-1.5" size="sm">
                <Check className="h-3.5 w-3.5" /> Verificar ordem
              </Button>
            ) : (
              <div className="space-y-2">
                <div className={`text-center p-2.5 rounded-lg ${
                  isCorrect ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                }`}>
                  <p className="font-mono font-bold text-sm">
                    {isCorrect ? "🎉 Ordem correta!" : "❌ Ordem incorreta"}
                  </p>
                  {!isCorrect && current.explicacao && (
                    <div className="mt-2 text-left">
                      <p className="text-[10px] font-mono opacity-70 mb-1">💡 Dica para entender:</p>
                      <p className="text-xs leading-relaxed opacity-90">{current.explicacao}</p>
                    </div>
                  )}
                </div>

                {hasNext ? (
                  <div className="flex gap-2">
                    {!isCorrect && (
                      <Button onClick={() => { setUserOrder(shuffle([...current.passos])); setSubmitted(false); }} className="flex-1 gap-1.5" size="sm" variant="ghost">
                        <RotateCcw className="h-3.5 w-3.5" /> Tentar de novo
                      </Button>
                    )}
                    <Button onClick={handleNext} className="flex-1 gap-1.5" size="sm" variant="outline">
                      <ChevronRight className="h-3.5 w-3.5" /> Próximo
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="pt-3 pb-2 text-center space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <Trophy className="h-5 w-5 text-primary" />
                          <p className="font-mono font-bold text-sm text-primary">Fim! 🎉</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Você acertou <strong>{score}</strong> de <strong>{total}</strong> desafios
                        </p>
                      </CardContent>
                    </Card>
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={restart}>
                      <RotateCcw className="h-3.5 w-3.5" /> Jogar novamente
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default OrdenarPassos;
