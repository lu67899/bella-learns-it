import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCcw, Trophy, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PALAVRAS = [
  { palavra: "ALGORITMO", dica: "Sequência de passos para resolver um problema" },
  { palavra: "VARIAVEL", dica: "Espaço na memória para armazenar dados" },
  { palavra: "FUNCAO", dica: "Bloco de código reutilizável" },
  { palavra: "RECURSAO", dica: "Técnica onde uma função chama a si mesma" },
  { palavra: "COMPILADOR", dica: "Traduz código fonte para linguagem de máquina" },
  { palavra: "SERVIDOR", dica: "Computador que fornece serviços a outros" },
  { palavra: "PROTOCOLO", dica: "Conjunto de regras para comunicação em rede" },
  { palavra: "FIREWALL", dica: "Barreira de segurança de rede" },
  { palavra: "HERANCA", dica: "Mecanismo de reuso em orientação a objetos" },
  { palavra: "POLIMORFISMO", dica: "Múltiplas formas para um mesmo método" },
  { palavra: "ENCAPSULAMENTO", dica: "Ocultar detalhes internos de um objeto" },
  { palavra: "ABSTRACÃO", dica: "Simplificar a complexidade escondendo detalhes" },
  { palavra: "ITERACAO", dica: "Repetição de um bloco de código" },
  { palavra: "DEPURACAO", dica: "Processo de encontrar e corrigir erros" },
  { palavra: "INDEXACAO", dica: "Estrutura para acelerar buscas no banco de dados" },
  { palavra: "THREADS", dica: "Unidades de execução dentro de um processo" },
  { palavra: "PILHA", dica: "Estrutura de dados LIFO" },
  { palavra: "ARVORE", dica: "Estrutura de dados hierárquica" },
  { palavra: "GRAFO", dica: "Estrutura com vértices e arestas" },
  { palavra: "HASH", dica: "Função que mapeia dados de tamanho variável" },
  { palavra: "ROTEADOR", dica: "Dispositivo que encaminha pacotes entre redes" },
  { palavra: "KERNEL", dica: "Núcleo do sistema operacional" },
  { palavra: "SCRUM", dica: "Framework ágil para gestão de projetos" },
  { palavra: "DEPLOY", dica: "Processo de disponibilizar uma aplicação" },
  { palavra: "BINARIO", dica: "Sistema numérico de base dois" },
];

const MAX_ERROS = 6;

const TECLADO = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const HangmanDrawing = ({ erros }: { erros: number }) => (
  <svg viewBox="0 0 200 200" className="w-40 h-40 mx-auto">
    {/* Base */}
    <line x1="20" y1="180" x2="100" y2="180" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
    {/* Poste */}
    <line x1="60" y1="180" x2="60" y2="30" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
    {/* Topo */}
    <line x1="60" y1="30" x2="140" y2="30" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
    {/* Corda */}
    <line x1="140" y1="30" x2="140" y2="50" stroke="currentColor" strokeWidth="3" className="text-muted-foreground" />
    {/* Cabeça */}
    {erros >= 1 && <circle cx="140" cy="65" r="15" stroke="currentColor" strokeWidth="3" fill="none" className="text-destructive" />}
    {/* Corpo */}
    {erros >= 2 && <line x1="140" y1="80" x2="140" y2="120" stroke="currentColor" strokeWidth="3" className="text-destructive" />}
    {/* Braço esquerdo */}
    {erros >= 3 && <line x1="140" y1="90" x2="120" y2="110" stroke="currentColor" strokeWidth="3" className="text-destructive" />}
    {/* Braço direito */}
    {erros >= 4 && <line x1="140" y1="90" x2="160" y2="110" stroke="currentColor" strokeWidth="3" className="text-destructive" />}
    {/* Perna esquerda */}
    {erros >= 5 && <line x1="140" y1="120" x2="120" y2="150" stroke="currentColor" strokeWidth="3" className="text-destructive" />}
    {/* Perna direita */}
    {erros >= 6 && <line x1="140" y1="120" x2="160" y2="150" stroke="currentColor" strokeWidth="3" className="text-destructive" />}
  </svg>
);

const Forca = () => {
  const navigate = useNavigate();
  const [palavraAtual, setPalavraAtual] = useState(() => PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)]);
  const [letrasUsadas, setLetrasUsadas] = useState<Set<string>>(new Set());
  const [erros, setErros] = useState(0);
  const [vitorias, setVitorias] = useState(0);
  const [derrotas, setDerrotas] = useState(0);

  const palavra = palavraAtual.palavra;
  const ganhou = [...palavra].every((l) => letrasUsadas.has(l));
  const perdeu = erros >= MAX_ERROS;
  const fimDeJogo = ganhou || perdeu;

  const tentarLetra = useCallback(
    (letra: string) => {
      if (fimDeJogo || letrasUsadas.has(letra)) return;
      const novas = new Set(letrasUsadas);
      novas.add(letra);
      setLetrasUsadas(novas);
      if (!palavra.includes(letra)) {
        setErros((e) => e + 1);
      }
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
    let nova = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
    while (nova.palavra === palavra && PALAVRAS.length > 1) {
      nova = PALAVRAS[Math.floor(Math.random() * PALAVRAS.length)];
    }
    setPalavraAtual(nova);
    setLetrasUsadas(new Set());
    setErros(0);
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-sm mx-auto space-y-4 pb-20">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground" onClick={() => navigate("/jogos")}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-mono font-bold">🪢 Forca</h1>
          <div className="flex gap-3 text-xs font-mono text-muted-foreground">
            <span className="text-green-500">✓ {vitorias}</span>
            <span className="text-destructive">✗ {derrotas}</span>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="pt-5 space-y-4">
            <HangmanDrawing erros={erros} />

            {/* Palavra */}
            <div className="flex justify-center gap-1.5 flex-wrap">
              {[...palavra].map((letra, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`w-8 h-10 flex items-center justify-center border-b-2 font-mono font-bold text-lg ${
                    fimDeJogo && !letrasUsadas.has(letra)
                      ? "text-destructive border-destructive/50"
                      : letrasUsadas.has(letra)
                      ? "text-foreground border-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {letrasUsadas.has(letra) || fimDeJogo ? letra : ""}
                </motion.div>
              ))}
            </div>

            {/* Dica */}
            <p className="text-center text-xs text-muted-foreground">
              💡 <span className="italic">{palavraAtual.dica}</span>
            </p>

            {/* Resultado */}
            <AnimatePresence>
              {fimDeJogo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-center p-3 rounded-lg ${
                    ganhou ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
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

        {/* Teclado */}
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
                            ? "bg-green-500/20 text-green-500 border border-green-500/30"
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
