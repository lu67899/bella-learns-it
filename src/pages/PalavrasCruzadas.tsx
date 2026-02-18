import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Loader2, Trophy, HelpCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface WordEntry {
  id: string;
  palavra: string;
  dica: string;
}

interface PlacedWord {
  word: string;
  dica: string;
  row: number;
  col: number;
  direction: "across" | "down";
  number: number;
}

interface CellData {
  letter: string;
  wordIndices: number[];
  number?: number;
}

const GRID_SIZE = 12;
const TARGET_WORDS = 6;

function generateCrossword(words: WordEntry[]): { grid: (CellData | null)[][]; placed: PlacedWord[] } {
  const sorted = [...words].sort((a, b) => b.palavra.length - a.palavra.length);
  const grid: (CellData | null)[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  const placed: PlacedWord[] = [];
  let numberCounter = 1;

  const canPlace = (word: string, row: number, col: number, dir: "across" | "down"): boolean => {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    if (row + dr * (word.length - 1) >= GRID_SIZE || col + dc * (word.length - 1) >= GRID_SIZE) return false;

    // Check cell before word
    const br = row - dr, bc = col - dc;
    if (br >= 0 && bc >= 0 && grid[br][bc]) return false;
    // Check cell after word
    const ar = row + dr * word.length, ac = col + dc * word.length;
    if (ar < GRID_SIZE && ac < GRID_SIZE && grid[ar][ac]) return false;

    let hasIntersection = placed.length === 0;
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      const cell = grid[r][c];
      if (cell) {
        if (cell.letter !== word[i]) return false;
        hasIntersection = true;
      } else {
        // Check perpendicular neighbors
        if (dir === "across") {
          if (r > 0 && grid[r - 1][c]) return false;
          if (r < GRID_SIZE - 1 && grid[r + 1][c]) return false;
        } else {
          if (c > 0 && grid[r][c - 1]) return false;
          if (c < GRID_SIZE - 1 && grid[r][c + 1]) return false;
        }
      }
    }
    return hasIntersection;
  };

  const placeWord = (word: string, dica: string, row: number, col: number, dir: "across" | "down") => {
    const dr = dir === "down" ? 1 : 0;
    const dc = dir === "across" ? 1 : 0;
    const idx = placed.length;
    const num = numberCounter++;
    for (let i = 0; i < word.length; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (!grid[r][c]) {
        grid[r][c] = { letter: word[i], wordIndices: [idx], number: i === 0 ? num : undefined };
      } else {
        grid[r][c]!.wordIndices.push(idx);
        if (i === 0 && !grid[r][c]!.number) grid[r][c]!.number = num;
      }
    }
    placed.push({ word, dica, row, col, direction: dir, number: num });
  };

  // Place first word in center
  if (sorted.length > 0) {
    const first = sorted[0];
    const startRow = Math.floor(GRID_SIZE / 2);
    const startCol = Math.max(0, Math.floor((GRID_SIZE - first.palavra.length) / 2));
    placeWord(first.palavra, first.dica, startRow, startCol, "across");
  }

  // Try placing remaining words
  for (let wi = 1; wi < sorted.length && placed.length < TARGET_WORDS; wi++) {
    const entry = sorted[wi];
    const word = entry.palavra;
    let bestPlaced = false;

    for (let dir of ["down", "across"] as const) {
      if (bestPlaced) break;
      for (let r = 0; r < GRID_SIZE && !bestPlaced; r++) {
        for (let c = 0; c < GRID_SIZE && !bestPlaced; c++) {
          if (canPlace(word, r, c, dir)) {
            placeWord(word, entry.dica, r, c, dir);
            bestPlaced = true;
          }
        }
      }
    }
  }

  return { grid, placed };
}

const PalavrasCruzadas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allWords, setAllWords] = useState<WordEntry[]>([]);
  const [grid, setGrid] = useState<(CellData | null)[][]>([]);
  const [placed, setPlaced] = useState<PlacedWord[]>([]);
  const [userInput, setUserInput] = useState<Record<string, string>>({});
  const [selectedClue, setSelectedClue] = useState<number | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [showHint, setShowHint] = useState<number | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const startGame = useCallback((words: WordEntry[]) => {
    const selected = shuffle(words).slice(0, Math.min(words.length, 10));
    const result = generateCrossword(selected);
    setGrid(result.grid);
    setPlaced(result.placed);
    setUserInput({});
    setSelectedClue(null);
    setGameWon(false);
    setShowHint(null);
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("cruzadas_palavras").select("id, palavra, dica");
      if (data && data.length > 0) {
        const cleaned = data.map(d => ({ ...d, palavra: d.palavra.toUpperCase().replace(/[^A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]/g, "") }));
        setAllWords(cleaned);
        startGame(cleaned);
      }
      setLoading(false);
    };
    load();
  }, [startGame]);

  // Check win
  useEffect(() => {
    if (placed.length === 0) return;
    const allCorrect = placed.every((pw) => {
      const dr = pw.direction === "down" ? 1 : 0;
      const dc = pw.direction === "across" ? 1 : 0;
      for (let i = 0; i < pw.word.length; i++) {
        const key = `${pw.row + dr * i}-${pw.col + dc * i}`;
        if ((userInput[key] || "").toUpperCase() !== pw.word[i]) return false;
      }
      return true;
    });
    if (allCorrect) setGameWon(true);
  }, [userInput, placed]);

  const handleInput = (row: number, col: number, value: string) => {
    const char = value.slice(-1).toUpperCase().replace(/[^A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]/g, "");
    const key = `${row}-${col}`;
    setUserInput((prev) => ({ ...prev, [key]: char }));

    // Auto-advance to next cell in the selected clue direction
    if (char && selectedClue !== null) {
      const pw = placed[selectedClue];
      const dr = pw.direction === "down" ? 1 : 0;
      const dc = pw.direction === "across" ? 1 : 0;
      for (let i = 0; i < pw.word.length; i++) {
        const r = pw.row + dr * i;
        const c = pw.col + dc * i;
        if (r === row && c === col && i < pw.word.length - 1) {
          const nextKey = `${pw.row + dr * (i + 1)}-${pw.col + dc * (i + 1)}`;
          inputRefs.current[nextKey]?.focus();
          break;
        }
      }
    }
  };

  const isHighlighted = (row: number, col: number): boolean => {
    if (selectedClue === null) return false;
    const pw = placed[selectedClue];
    const dr = pw.direction === "down" ? 1 : 0;
    const dc = pw.direction === "across" ? 1 : 0;
    for (let i = 0; i < pw.word.length; i++) {
      if (pw.row + dr * i === row && pw.col + dc * i === col) return true;
    }
    return false;
  };

  const isCorrectCell = (row: number, col: number): boolean => {
    const cell = grid[row]?.[col];
    if (!cell) return false;
    return (userInput[`${row}-${col}`] || "").toUpperCase() === cell.letter;
  };

  // Find grid bounds for compact rendering
  let minR = GRID_SIZE, maxR = 0, minC = GRID_SIZE, maxC = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r]?.[c]) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  const visRows = maxR >= minR ? maxR - minR + 1 : 0;
  const visCols = maxC >= minC ? maxC - minC + 1 : 0;

  const acrossClues = placed.filter((p) => p.direction === "across");
  const downClues = placed.filter((p) => p.direction === "down");

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (allWords.length < 3) {
    return (
      <Layout>
        <div className="max-w-md mx-auto space-y-4 pb-20">
          <BackButton to="/jogos" />
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-mono">✏️ Palavras Cruzadas</p>
            <p className="text-sm mt-2">São necessárias pelo menos 3 palavras cadastradas.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (placed.length === 0) {
    return (
      <Layout>
        <div className="max-w-md mx-auto space-y-4 pb-20">
          <BackButton to="/jogos" />
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-mono">✏️ Palavras Cruzadas</p>
            <p className="text-sm mt-2">Não foi possível gerar a grade. Tente novamente.</p>
            <Button size="sm" variant="ghost" className="mt-3 gap-1.5" onClick={() => startGame(allWords)}>
              <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto space-y-3 pb-20">
        <BackButton to="/jogos" />

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-mono font-bold">✏️ Palavras Cruzadas</h1>
          <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => startGame(allWords)}>
            <RotateCcw className="h-3.5 w-3.5" /> Nova
          </Button>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <div
            className="mx-auto"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${visCols}, minmax(0, 1fr))`,
              gap: "2px",
              maxWidth: `${visCols * 34}px`,
            }}
          >
            {Array.from({ length: visRows }).map((_, ri) =>
              Array.from({ length: visCols }).map((_, ci) => {
                const r = minR + ri;
                const c = minC + ci;
                const cell = grid[r]?.[c];
                if (!cell) {
                  return <div key={`${r}-${c}`} className="aspect-square" />;
                }
                const key = `${r}-${c}`;
                const highlighted = isHighlighted(r, c);
                const correct = isCorrectCell(r, c);
                const filled = !!userInput[key];
                return (
                  <div
                    key={key}
                    className={`aspect-square relative border rounded transition-colors ${
                      gameWon
                        ? "border-primary/40 bg-primary/5"
                        : highlighted
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-card"
                    }`}
                    onClick={() => {
                      if (cell.wordIndices.length > 0) {
                        const nextClue = selectedClue !== null && cell.wordIndices.includes(selectedClue)
                          ? cell.wordIndices[(cell.wordIndices.indexOf(selectedClue) + 1) % cell.wordIndices.length]
                          : cell.wordIndices[0];
                        setSelectedClue(nextClue);
                      }
                      inputRefs.current[key]?.focus();
                    }}
                  >
                    {cell.number && (
                      <span className="absolute top-0 left-0.5 text-[7px] font-mono text-muted-foreground leading-none">
                        {cell.number}
                      </span>
                    )}
                    <input
                      ref={(el) => { inputRefs.current[key] = el; }}
                      type="text"
                      inputMode="text"
                      maxLength={2}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-1p-ignore=""
                      data-lpignore="true"
                      data-form-type="other"
                      data-credential="false"
                      aria-autocomplete="none"
                      value={userInput[key] || ""}
                      onChange={(e) => handleInput(r, c, e.target.value)}
                      disabled={gameWon}
                      className={`absolute inset-0 w-full h-full text-center font-mono font-bold text-sm bg-transparent outline-none caret-primary ${
                        gameWon ? "text-primary" : correct && filled ? "text-foreground" : "text-foreground"
                      }`}
                      style={{ paddingTop: cell.number ? "6px" : "0" }}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Clues */}
        <div className="grid grid-cols-2 gap-3">
          {acrossClues.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">→ Horizontal</p>
              {acrossClues.map((pw) => {
                const idx = placed.indexOf(pw);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedClue(idx)}
                    className={`w-full text-left p-1.5 rounded text-[10px] leading-tight transition-colors ${
                      selectedClue === idx
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="font-mono font-bold">{pw.number}.</span> {pw.dica}
                    {showHint === idx && (
                      <span className="block text-[9px] text-primary/60 mt-0.5">
                        {pw.word.length} letras · começa com "{pw.word[0]}"
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {downClues.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">↓ Vertical</p>
              {downClues.map((pw) => {
                const idx = placed.indexOf(pw);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedClue(idx)}
                    className={`w-full text-left p-1.5 rounded text-[10px] leading-tight transition-colors ${
                      selectedClue === idx
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="font-mono font-bold">{pw.number}.</span> {pw.dica}
                    {showHint === idx && (
                      <span className="block text-[9px] text-primary/60 mt-0.5">
                        {pw.word.length} letras · começa com "{pw.word[0]}"
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Hint button */}
        {selectedClue !== null && !gameWon && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => setShowHint(showHint === selectedClue ? null : selectedClue)}
            >
              <HelpCircle className="h-3 w-3" /> {showHint === selectedClue ? "Esconder dica" : "Ver dica extra"}
            </Button>
          </div>
        )}

        <AnimatePresence>
          {gameWon && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4 pb-3 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <p className="font-mono font-bold text-sm text-primary">Parabéns! 🎉</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Você completou todas as <strong>{placed.length}</strong> palavras!
                  </p>
                  <Button size="sm" variant="ghost" className="gap-1.5 mt-1" onClick={() => startGame(allWords)}>
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

export default PalavrasCruzadas;
