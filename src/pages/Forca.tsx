import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Palavra {
  id: string;
  palavra: string;
  dica: string;
}

const MAX_ERROS = 6;

const TECLADO = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const HangmanDrawing = ({ erros }: { erros: number }) => (
  <svg viewBox="0 0 200 200" className="w-40 h-40 mx-auto">
    <line x1="20" y1="180" x2="100" y2="180" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
    <line x1="60" y1="180" x2="60" y2="30" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
    <line x1="60" y1="30" x2="140" y2="30" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
    <line x1="140" y1="30" x2="140" y2="50" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
    {erros >= 1 && <circle cx="140" cy="65" r="15" stroke="currentColor" strokeWidth="3" fill="none" className="text-destructive" />}
    {erros >= 2 && <line x1="140" y1="80" x2="140" y2="120" stroke="currentColor" strokeWidth="3" className="text-destructive" />}
    {erros >= 3 && <line x1="140" y1="90" x2="120" y2="110" stroke="currentColor" strokeWidth="3" className="text-destructive" />}
    {erros >= 4 && <line x1="140" y1="90" x2="160" y2="110" stroke="currentColor" strokeWidth="3" className="text-destructive" />}
    {erros >= 5 && <line x1="140" y1="120" x2="120" y2="150" stroke="currentColor" strokeWidth="3" className="text-destructive" />}
    {erros >= 6 && <line x1="140" y1="120" x2="160" y2="150" stroke="currentColor" strokeWidth="3" className="text-destructive" />}
  </svg>
);

const Forca = () => {
  const navigate = useNavigate();
  const [palavras, setPalavras] = useState<Palavra[]>([]);
  const [loading, setLoading] = useState(true);
  const [palavraAtual, setPalavraAtual] = useState<Palavra | null>(null);
  const [letrasUsadas, setLetrasUsadas] = useState<Set<string>>(new Set());
  const [erros, setErros] = useState(0);
  const [vitorias, setVitorias] = useState(0);
  const [derrotas, setDerrotas] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("forca_palavras").select("*");
      if (data && data.length > 0) {
        setPalavras(data);
        setPalavraAtual(data[Math.floor(Math.random() * data.length)]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const palavra = palavraAtual?.palavra || "";
  const ganhou = palavra.length > 0 && [...palavra].every((l) => letrasUsadas.has(l));
  const perdeu = erros >= MAX_ERROS;
  const fimDeJogo = ganhou || perdeu;

  const tentarLetra = useCallback(
    (letra: string) => {
      if (fimDeJogo || letrasUsadas.has(letra) || !palavra) return;
      const novas = new Set(letrasUsadas);
      novas.add(letra);
      setLetrasUsadas(novas);
      if (!palavra.includes(letra)) setErros((e) => e + 1);
    },
    [fimDeJogo, letrasUsadas, palavra]
  );

  useEffect(() => {
    if (ganhou) setVitorias((v) => v + 1);
    if (perdeu) setDerrotas((d) => d + 1);
  }, [ganhou, perdeu]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) tentarLetra(key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tentarLetra]);

  const novaPartida = () => {
    if (palavras.length === 0) return;
    let nova = palavras[Math.floor(Math.random() * palavras.length)];
    while (nova.id === palavraAtual?.id && palavras.length > 1) {
      nova = palavras[Math.floor(Math.random() * palavras.length)];
    }
    setPalavraAtual(nova);
    setLetrasUsadas(new Set());
    setErros(0);
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

  if (palavras.length === 0) {
    return (
      <Layout>
        <div className="max-w-sm mx-auto space-y-4 pb-20">
          <BackButton to="/jogos" />
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-mono">🪢 Forca</p>
            <p className="text-sm mt-2">Nenhuma palavra cadastrada ainda.</p>
            <p className="text-xs mt-1">O administrador precisa adicionar palavras no painel.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-sm mx-auto space-y-4 pb-20">
        <BackButton to="/jogos" />

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-mono font-bold">🪢 Forca</h1>
          <div className="flex gap-3 text-xs font-mono text-muted-foreground">
            <span className="text-primary">✓ {vitorias}</span>
            <span className="text-destructive">✗ {derrotas}</span>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="pt-5 space-y-4">
            <HangmanDrawing erros={erros} />

            <div className="flex justify-center gap-1.5 flex-wrap">
              {[...palavra].map((letra, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`w-8 h-10 flex items-center justify-center border-b-2 font-mono font-bold text-lg ${
                    letrasUsadas.has(letra)
                      ? "text-foreground border-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {letrasUsadas.has(letra) ? letra : ""}
                </motion.div>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              💡 <span className="italic">{palavraAtual?.dica}</span>
            </p>

            <AnimatePresence>
              {fimDeJogo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center p-3 rounded-lg ${
                    ganhou ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <p className="font-mono font-bold text-sm">
                    {ganhou ? "🎉 Parabéns! Você acertou!" : "💀 Você perdeu!"}
                  </p>
                  <Button size="sm" variant="ghost" className="mt-2 gap-1.5" onClick={novaPartida}>
                    <RotateCcw className="h-3.5 w-3.5" /> Nova palavra
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {!fimDeJogo && (
          <Card className="border-border bg-card">
            <CardContent className="pt-4 pb-3 space-y-1.5">
              {TECLADO.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-1">
                  {row.map((letra) => {
                    const usada = letrasUsadas.has(letra);
                    const acertou = usada && palavra.includes(letra);
                    const errou = usada && !palavra.includes(letra);
                    return (
                      <button
                        key={letra}
                        onClick={() => tentarLetra(letra)}
                        disabled={usada}
                        className={`w-8 h-9 rounded-md text-xs font-mono font-bold transition-all ${
                          acertou
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : errou
                            ? "bg-destructive/10 text-destructive/40 border border-destructive/10"
                            : "bg-muted hover:bg-accent text-foreground border border-border"
                        } disabled:cursor-not-allowed`}
                      >
                        {letra}
                      </button>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </Layout>
  );
};

export default Forca;
