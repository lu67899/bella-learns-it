import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Loader2, Clock, Trophy } from "lucide-react";
import BackButton from "@/components/BackButton";
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
  const [allPairs, setAllPairs] = useState<{ termo: string; definicao: string; id: string }[]>([]);
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
    (pairs: { termo: string; definicao: string; id: string }[]) => {
      const selected = shuffle(pairs).slice(0, TOTAL_PAIRS);
      const deck: MemoryCard[] = [];
      selected.forEach((p) => {
        deck.push({ id: `t-${p.id}`, content: p.termo, type: "termo", pairId: p.id });
        deck.push({ id: `d-${p.id}`, content: p.definicao, type: "definicao", pairId: p.id });
      });
      return shuffle(deck);
    },
    []
  );

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("memoria_pares").select("id, termo, definicao");
      if (data && data.length > 0) {
        setAllPairs(data);
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
    setCards(buildCards(allPairs));
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

  if (allPairs.length < TOTAL_PAIRS) {
    return (
      <Layout>
        <div className="max-w-md mx-auto space-y-4 pb-20">
          <BackButton to="/jogos" />
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
        <BackButton to="/jogos" />

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
              <div
                key={card.id}
                onClick={() => handleFlip(i)}
                className={`relative cursor-pointer select-none aspect-[3/4] rounded-lg border transition-colors duration-300 overflow-hidden ${
                  isMatched
                    ? "border-primary/40 bg-primary/5"
                    : isFlipped
                    ? "border-accent bg-card"
                    : "border-border bg-muted hover:border-primary/30 active:scale-95"
                } transition-transform`}
              >
                {isFlipped ? (
                  <div className="absolute inset-0 flex items-center justify-center p-1.5">
                    <p className={`text-center leading-tight break-words ${
                      card.type === "termo"
                        ? "text-[10px] sm:text-xs font-bold text-foreground font-mono"
                        : "text-[9px] sm:text-[10px] text-muted-foreground italic"
                    }`}>
                      {card.content}
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg">❓</span>
                  </div>
                )}
              </div>
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
