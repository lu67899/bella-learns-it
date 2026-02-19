import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gamepad2, ChevronRight, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

interface JogoIframe {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  iframe_url: string;
  ordem: number;
}

const jogosEducativos = [
  { id: "quiz", nome: "Quiz", descricao: "Teste seus conhecimentos com questões de múltipla escolha", icon: "🧠", to: "/quiz" },
  { id: "forca", nome: "Forca", descricao: "Adivinhe a palavra antes que o boneco seja enforcado", icon: "🪢", to: "/forca" },
  { id: "caca-palavras", nome: "Caça-Palavras", descricao: "Encontre as palavras escondidas na grade de letras", icon: "🔍", to: "/caca-palavras" },
  { id: "jogo-da-memoria", nome: "Jogo da Memória", descricao: "Encontre os pares de termo e definição virando as cartas", icon: "🧠", to: "/jogo-da-memoria" },
  { id: "palavras-cruzadas", nome: "Palavras Cruzadas", descricao: "Preencha a grade com as palavras a partir das dicas", icon: "✏️", to: "/palavras-cruzadas" },
  { id: "ordenar-passos", nome: "Ordene os Passos", descricao: "Coloque as etapas de processos de SI na ordem correta", icon: "📋", to: "/ordenar-passos" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const Jogos = () => {
  const [jogosIframe, setJogosIframe] = useState<JogoIframe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJogos = async () => {
      const { data } = await supabase
        .from("jogos_iframe")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      setJogosIframe((data as JogoIframe[]) || []);
      setLoading(false);
    };
    fetchJogos();
  }, []);

  return (
    <Layout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto space-y-6 pb-20"
      >
        <motion.div variants={item}>
          <div className="mb-5">
            <BackButton to="/" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono">Jogos</h1>
              <p className="text-xs text-muted-foreground">
                Jogos educativos e diversão para reforçar o aprendizado
              </p>
            </div>
          </div>
        </motion.div>

        {/* Jogos Educativos */}
        <motion.div variants={item}>
          <p className="text-[10px] font-mono font-semibold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 px-1">
            📚 Educativos
          </p>
          <div className="grid gap-3">
            {jogosEducativos.map((jogo) => (
              <Link key={jogo.id} to={jogo.to}>
                <motion.div
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    {jogo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium">{jogo.nome}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{jogo.descricao}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Jogos Iframe */}
        {loading ? (
          <motion.div variants={item} className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </motion.div>
        ) : jogosIframe.length > 0 && (
          <motion.div variants={item}>
            <p className="text-[10px] font-mono font-semibold text-muted-foreground/60 uppercase tracking-[0.2em] mb-2 px-1">
              🎮 Mini Games
            </p>
            <div className="grid gap-3">
              {jogosIframe.map((jogo) => (
                <Link key={jogo.id} to={`/jogo-iframe/${jogo.id}`}>
                  <motion.div
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                      {jogo.icone || "🎮"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-medium">{jogo.nome}</p>
                      {jogo.descricao && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{jogo.descricao}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Jogos;
