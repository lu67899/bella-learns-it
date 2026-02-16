import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Loader2, Clock, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface MemoryCard {
  id: string;
  content: string;
  type: "termo" | "definicao";
  pairId: string;
}

const TOTAL_PAIRS = 6;

const JogoDaMemoria = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [allWords, setAllWords] = useState<{ palavra: string; dica: string; id: string }[]>([]);
  const [gameWon, setGameWon] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const buildCards = useCallback(
    (words: { palavra: string; dica: string; id: string }[]) => {
      const selected = shuffle(words).slice(0, TOTAL_PAIRS);
      const deck: MemoryCard[] = [];
      selected.forEach((w) => {
        deck.push({ id: `t-${w.id}`, content: w.palavra, type: "termo", pairId: w.id });
        deck.push({ id: `d-${w.id}`, content: w.dica, type: "definicao", pairId: w.id });
      });
      return shuffle(deck);
    },
    []
  );

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("forca_palavras").select("id, palavra, dica");
      if (data && data.length > 0) {
        setAllWords(data);
        setCards(buildCards(data));
      }
      setLoading(false);
    };
    load();
  }, [buildCards]);

  // Timer
  useEffect(() => {
    if (loading || gameWon || cards.length === 0) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading, gameWon, cards.length]);

  // Check win
  useEffect(() => {
    if (cards.length > 0 && matched.size === cards.length / 2) {
      setGameWon(true);
    }
  }, [matched, cards.length]);

  const handleFlip = (index: number) => {
    if (locked || flipped.includes(index) || matched.has(cards[index].pairId)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = newFlipped;
      if (cards[a].pairId === cards[b].pairId) {
        setMatched((prev) => new Set(prev).add(cards[a].pairId));
        setFlipped([]);
        setLocked(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  const restart = () => {
    setCards(buildCards(allWords));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLocked(false);
    setGameWon(false);
    setSeconds(0);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (allWords.length < TOTAL_PAIRS) {
    return (
      <Layout>
        <div className="max-w-md mx-auto space-y-4 pb-20">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => navigate("/jogos")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-mono">🧠 Jogo da Memória</p>
            <p className="text-sm mt-2">São necessárias pelo menos {TOTAL_PAIRS} palavras cadastradas.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto space-y-4 pb-20">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => navigate("/jogos")}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-mono font-bold">🧠 Jogo da Memória</h1>
          <div className="flex gap-3 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatTime(seconds)}</span>
            <span>{moves} jogadas</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Encontre os pares: <Badge variant="outline" className="text-[10px] mx-0.5">TERMO</Badge> ↔ <Badge variant="secondary" className="text-[10px] mx-0.5">DEFINIÇÃO</Badge>
        </p>

        <div className="grid grid-cols-4 gap-1.5">
          {cards.map((card, i) => {
            const isFlipped = flipped.includes(i) || matched.has(card.pairId);
            const isMatched = matched.has(card.pairId);
            return (
              <motion.div
                key={card.id}
                whileTap={!isFlipped ? { scale: 0.95 } : {}}
                onClick={() => handleFlip(i)}
                className={`relative cursor-pointer select-none aspect-square rounded-lg border-2 transition-colors duration-300 ${
                  isMatched
                    ? "border-primary/40 bg-primary/5"
                    : isFlipped
                    ? "border-accent bg-card"
                    : "border-border bg-muted hover:border-primary/30"
                }`}
              >
                <AnimatePresence mode="wait">
                  {isFlipped ? (
                    <motion.div
                      key="front"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center p-2"
                    >
                      <p className={`text-center font-mono leading-tight ${
                        card.type === "termo"
                          ? "text-xs sm:text-sm font-bold text-foreground"
                          : "text-[10px] sm:text-xs text-muted-foreground italic"
                      }`}>
                        {card.content}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="text-2xl">❓</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {gameWon && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 pb-3 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <p className="font-mono font-bold text-sm text-primary">Parabéns! 🎉</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Você completou em <strong>{moves}</strong> jogadas e <strong>{formatTime(seconds)}</strong>
                  </p>
                  <Button size="sm" variant="ghost" className="gap-1.5 mt-1" onClick={restart}>
                    <RotateCcw className="h-3.5 w-3.5" /> Jogar novamente
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
};

export default JogoDaMemoria;
