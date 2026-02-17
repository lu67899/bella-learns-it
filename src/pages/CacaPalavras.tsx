import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Loader2, Trophy, Timer } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const GRID_SIZE = 10;
const NUM_WORDS = 5;

type Direction = [number, number];
const DIRECTIONS: Direction[] = [
  [0, 1],   // horizontal →
  [1, 0],   // vertical ↓
  [1, 1],   // diagonal ↘
  [0, -1],  // horizontal ←
  [-1, 0],  // vertical ↑
  [-1, -1], // diagonal ↖
  [1, -1],  // diagonal ↙
  [-1, 1],  // diagonal ↗
];

interface PlacedWord {
  word: string;
  cells: [number, number][];
  found: boolean;
}

function generateGrid(words: string[]): { grid: string[][]; placed: PlacedWord[] } {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(""));
  const placed: PlacedWord[] = [];

  const shuffled = [...words].sort(() => Math.random() - 0.5);

  for (const word of shuffled) {
    if (placed.length >= NUM_WORDS) break;
    if (word.length > GRID_SIZE) continue;

    let attempts = 0;
    let didPlace = false;

    while (attempts < 100 && !didPlace) {
      attempts++;
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);

      const cells: [number, number][] = [];
      let canPlace = true;

      for (let i = 0; i < word.length; i++) {
        const r = row + dir[0] * i;
        const c = col + dir[1] * i;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) { canPlace = false; break; }
        if (grid[r][c] !== "" && grid[r][c] !== word[i]) { canPlace = false; break; }
        cells.push([r, c]);
      }

      if (canPlace) {
        cells.forEach(([r, c], i) => { grid[r][c] = word[i]; });
        placed.push({ word, cells, found: false });
        didPlace = true;
      }
    }
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === "") {
        grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid, placed };
}

const CacaPalavras = () => {
  const navigate = useNavigate();
  const [allWords, setAllWords] = useState<string[]>([]);
  const [wordHints, setWordHints] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [grid, setGrid] = useState<string[][]>([]);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [wins, setWins] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [lost, setLost] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("forca_palavras").select("palavra, dica");
      if (data && data.length > 0) {
        setAllWords(data.map((d) => d.palavra.toUpperCase()));
        const hints: Record<string, string> = {};
        data.forEach((d) => { hints[d.palavra.toUpperCase()] = d.dica; });
        setWordHints(hints);
      }
      setLoading(false);
    };
    load();
  }, []);

  const startGame = useCallback(() => {
    if (allWords.length === 0) return;
    const { grid: g, placed } = generateGrid(allWords);
    setGrid(g);
    setPlacedWords(placed);
    setSelectedCells([]);
    setFoundCells(new Set());
    setStartCell(null);
    setTimeLeft(120);
    setLost(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [allWords]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    if (allWords.length > 0) startGame();
  }, [allWords, startGame]);

  const allFound = placedWords.length > 0 && placedWords.every((w) => w.found);
  const gameOver = allFound || lost;

  useEffect(() => {
    if (timeLeft === 0 && !allFound) {
      setLost(true);
    }
  }, [timeLeft, allFound]);

  useEffect(() => {
    if (allFound && placedWords.length > 0) {
      setWins((v) => v + 1);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [allFound]);

  const cellKey = (r: number, c: number) => `${r},${c}`;

  const getCellsInLine = (start: [number, number], end: [number, number]): [number, number][] => {
    const dr = Math.sign(end[0] - start[0]);
    const dc = Math.sign(end[1] - start[1]);
    const len = Math.max(Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1]));
    
    const diffR = Math.abs(end[0] - start[0]);
    const diffC = Math.abs(end[1] - start[1]);
    if (diffR !== 0 && diffC !== 0 && diffR !== diffC) return [start];

    const cells: [number, number][] = [];
    for (let i = 0; i <= len; i++) {
      cells.push([start[0] + dr * i, start[1] + dc * i]);
    }
    return cells;
  };

  const checkWord = (cells: [number, number][]) => {
    const selectedWord = cells.map(([r, c]) => grid[r][c]).join("");
    const selectedWordReversed = [...selectedWord].reverse().join("");

    const newPlaced = [...placedWords];
    let foundAny = false;

    for (let i = 0; i < newPlaced.length; i++) {
      if (newPlaced[i].found) continue;
      if (newPlaced[i].word === selectedWord || newPlaced[i].word === selectedWordReversed) {
        newPlaced[i] = { ...newPlaced[i], found: true };
        const newFound = new Set(foundCells);
        cells.forEach(([r, c]) => newFound.add(cellKey(r, c)));
        setFoundCells(newFound);
        foundAny = true;
        break;
      }
    }

    if (foundAny) {
      setPlacedWords(newPlaced);
    }
  };

  const handleCellTap = (r: number, c: number) => {
    if (gameOver) return;
    if (!startCell) {
      // First tap: set start
      setStartCell([r, c]);
      setSelectedCells([[r, c]]);
    } else {
      // Second tap: compute line, check word, reset
      const cells = getCellsInLine(startCell, [r, c]);
      setSelectedCells(cells);
      checkWord(cells);
      // Reset after a brief highlight
      setTimeout(() => {
        setSelectedCells([]);
        setStartCell(null);
      }, 300);
    }
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

  if (allWords.length < 3) {
    return (
      <Layout>
        <div className="max-w-sm mx-auto space-y-4 pb-20">
          <BackButton to="/jogos" />
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-mono">🔍 Caça-Palavras</p>
            <p className="text-sm mt-2">Palavras insuficientes para montar o jogo.</p>
            <p className="text-xs mt-1">O administrador precisa cadastrar mais palavras no painel.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const selectedSet = new Set(selectedCells.map(([r, c]) => cellKey(r, c)));

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto space-y-4 pb-20">
        <BackButton to="/jogos" />

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-mono font-bold">🔍 Caça-Palavras</h1>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-mono font-bold flex items-center gap-1 ${timeLeft <= 30 ? "text-destructive" : timeLeft <= 60 ? "text-amber-500" : "text-muted-foreground"}`}>
              <Timer className="h-3.5 w-3.5" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 inline mr-1 text-primary" />{wins}
            </span>
          </div>
        </div>
        {!gameOver && (
          <Progress value={(timeLeft / 120) * 100} className="h-1.5" />
        )}

        {/* Word list */}
        <div className="flex flex-wrap gap-1.5">
          {placedWords.map((pw) => (
            <Badge
              key={pw.word}
              variant={pw.found ? "default" : "outline"}
              className={`text-sm font-mono transition-all py-1 px-2.5 ${
                pw.found ? "bg-primary/20 text-primary line-through border-primary/30" : "text-muted-foreground"
              }`}
            >
              {pw.word}
            </Badge>
          ))}
        </div>

        {/* Grid */}
        <Card className="border-border bg-card">
          <CardContent className="p-2 sm:p-3">
            <p className="text-xs text-muted-foreground text-center mb-2 font-mono">
              {startCell ? "Toque na última letra da palavra" : "Toque na primeira letra da palavra"}
            </p>
            <div
              className="grid select-none"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: "3px" }}
            >
              {grid.map((row, r) =>
                row.map((letter, c) => {
                  const key = cellKey(r, c);
                  const isFound = foundCells.has(key);
                  const isSelected = selectedSet.has(key);
                  const isStart = startCell && startCell[0] === r && startCell[1] === c;
                  return (
                    <div
                      key={key}
                      onClick={() => handleCellTap(r, c)}
                      className={`aspect-square flex items-center justify-center rounded-md text-sm sm:text-base font-mono font-bold cursor-pointer transition-colors ${
                        isFound
                          ? "bg-primary/20 text-primary"
                          : isStart
                          ? "bg-accent ring-2 ring-primary text-accent-foreground"
                          : isSelected
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted/50 text-foreground hover:bg-muted"
                      }`}
                    >
                      {letter}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className={`text-center p-4 rounded-lg ${allFound ? "bg-primary/10" : "bg-destructive/10"}`}>
              <p className={`font-mono font-bold text-sm ${allFound ? "text-primary" : "text-destructive"}`}>
                {allFound ? "🎉 Parabéns! Encontrou todas!" : `⏰ Tempo esgotado! Encontrou ${placedWords.filter(w => w.found).length}/${placedWords.length}`}
              </p>
              <Button size="sm" variant="ghost" className="mt-2 gap-1.5" onClick={startGame}>
                <RotateCcw className="h-3.5 w-3.5" /> Novo jogo
              </Button>
            </div>

            <Card className="border-border bg-card">
              <CardContent className="pt-4 pb-3 space-y-2.5">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">📚 O que cada palavra significa:</p>
                {placedWords.map((pw) => (
                  <div key={pw.word} className={`flex gap-2 items-start py-1.5 border-b border-border last:border-0 ${!pw.found && lost ? "opacity-60" : ""}`}>
                    <Badge variant={pw.found ? "secondary" : "outline"} className={`text-xs font-mono font-bold shrink-0 mt-0.5 ${!pw.found ? "text-destructive border-destructive/30" : ""}`}>{pw.word}</Badge>
                    <p className="text-sm text-muted-foreground">{wordHints[pw.word] || "—"}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default CacaPalavras;
