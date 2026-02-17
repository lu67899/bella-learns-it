import { motion } from "framer-motion";
import { Gamepad2, ChevronRight } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

const jogos = [
  {
    id: "quiz",
    nome: "Quiz",
    descricao: "Teste seus conhecimentos com questões de múltipla escolha",
    icon: "🧠",
    to: "/quiz",
  },
  {
    id: "forca",
    nome: "Forca",
    descricao: "Adivinhe a palavra antes que o boneco seja enforcado",
    icon: "🪢",
    to: "/forca",
  },
  {
    id: "caca-palavras",
    nome: "Caça-Palavras",
    descricao: "Encontre as palavras escondidas na grade de letras",
    icon: "🔍",
    to: "/caca-palavras",
  },
  {
    id: "jogo-da-memoria",
    nome: "Jogo da Memória",
    descricao: "Encontre os pares de termo e definição virando as cartas",
    icon: "🧠",
    to: "/jogo-da-memoria",
  },
  {
    id: "palavras-cruzadas",
    nome: "Palavras Cruzadas",
    descricao: "Preencha a grade com as palavras a partir das dicas",
    icon: "✏️",
    to: "/palavras-cruzadas",
  },
  {
    id: "ordenar-passos",
    nome: "Ordene os Passos",
    descricao: "Coloque as etapas de processos de SI na ordem correta",
    icon: "📋",
    to: "/ordenar-passos",
  },
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
  const navigate = useNavigate();
  return (
    <Layout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto space-y-6 pb-20"
      >
        <motion.div variants={item}>
          <div className="mb-4">
            <BackButton to="/" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono">Jogos</h1>
              <p className="text-xs text-muted-foreground">
                Jogos educativos para reforçar o aprendizado
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="grid gap-3">
          {jogos.map((jogo) => (
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
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {jogo.descricao}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {jogos.length === 1 && (
          <motion.div variants={item}>
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-xs font-mono">Mais jogos em breve! 🎮</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Jogos;
