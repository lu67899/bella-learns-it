import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, Loader2, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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
  const [loading, setLoading] = useState(true);
  const [grid, setGrid] = useState<string[][]>([]);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [wins, setWins] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("forca_palavras").select("palavra");
      if (data && data.length > 0) {
        setAllWords(data.map((d) => d.palavra.toUpperCase()));
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
    setIsSelecting(false);
  }, [allWords]);

  useEffect(() => {
    if (allWords.length > 0) startGame();
  }, [allWords, startGame]);

  const allFound = placedWords.length > 0 && placedWords.every((w) => w.found);

  useEffect(() => {
    if (allFound && placedWords.length > 0) setWins((v) => v + 1);
  }, [allFound]);

  const cellKey = (r: number, c: number) => `${r},${c}`;

  const getCellsInLine = (start: [number, number], end: [number, number]): [number, number][] => {
    const dr = Math.sign(end[0] - start[0]);
    const dc = Math.sign(end[1] - start[1]);
    const len = Math.max(Math.abs(end[0] - start[0]), Math.abs(end[1] - start[1]));
    
    // Only allow straight lines (horizontal, vertical, diagonal)
    const diffR = Math.abs(end[0] - start[0]);
    const diffC = Math.abs(end[1] - start[1]);
    if (diffR !== 0 && diffC !== 0 && diffR !== diffC) return [start];

    const cells: [number, number][] = [];
    for (let i = 0; i <= len; i++) {
      cells.push([start[0] + dr * i, start[1] + dc * i]);
    }
    return cells;
  };

  const handlePointerDown = (r: number, c: number) => {
    setIsSelecting(true);
    setStartCell([r, c]);
    setSelectedCells([[r, c]]);
  };

  const handlePointerEnter = (r: number, c: number) => {
    if (!isSelecting || !startCell) return;
    setSelectedCells(getCellsInLine(startCell, [r, c]));
  };

  const handlePointerUp = () => {
    setIsSelecting(false);
    
    const selectedWord = selectedCells.map(([r, c]) => grid[r][c]).join("");
    const selectedWordReversed = [...selectedWord].reverse().join("");

    const newPlaced = [...placedWords];
    let foundAny = false;

    for (let i = 0; i < newPlaced.length; i++) {
      if (newPlaced[i].found) continue;
      if (newPlaced[i].word === selectedWord || newPlaced[i].word === selectedWordReversed) {
        newPlaced[i] = { ...newPlaced[i], found: true };
        const newFound = new Set(foundCells);
        selectedCells.forEach(([r, c]) => newFound.add(cellKey(r, c)));
        setFoundCells(newFound);
        foundAny = true;
        break;
      }
    }

    if (foundAny) {
      setPlacedWords(newPlaced);
    }
    setSelectedCells([]);
    setStartCell(null);
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
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => navigate("/jogos")}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-sm mx-auto space-y-4 pb-20">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => navigate("/jogos")}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-mono font-bold">🔍 Caça-Palavras</h1>
          <span className="text-xs font-mono text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 inline mr-1 text-primary" />{wins}
          </span>
        </div>

        {/* Word list */}
        <div className="flex flex-wrap gap-1.5">
          {placedWords.map((pw) => (
            <Badge
              key={pw.word}
              variant={pw.found ? "default" : "outline"}
              className={`text-xs font-mono transition-all ${
                pw.found ? "bg-primary/20 text-primary line-through border-primary/30" : "text-muted-foreground"
              }`}
            >
              {pw.word}
            </Badge>
          ))}
        </div>

        {/* Grid */}
        <Card className="border-border bg-card">
          <CardContent className="p-3">
            <div
              className="grid select-none touch-none"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: "2px" }}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => { if (isSelecting) handlePointerUp(); }}
            >
              {grid.map((row, r) =>
                row.map((letter, c) => {
                  const key = cellKey(r, c);
                  const isFound = foundCells.has(key);
                  const isSelected = selectedSet.has(key);
                  return (
                    <div
                      key={key}
                      onPointerDown={(e) => { e.preventDefault(); handlePointerDown(r, c); }}
                      onPointerEnter={() => handlePointerEnter(r, c)}
                      className={`aspect-square flex items-center justify-center rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                        isFound
                          ? "bg-primary/20 text-primary"
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

        {allFound && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 rounded-lg bg-primary/10"
          >
            <p className="font-mono font-bold text-sm text-primary">🎉 Parabéns! Encontrou todas!</p>
            <Button size="sm" variant="ghost" className="mt-2 gap-1.5" onClick={startGame}>
              <RotateCcw className="h-3.5 w-3.5" /> Novo jogo
            </Button>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default CacaPalavras;
