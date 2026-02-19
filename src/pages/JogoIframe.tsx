import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface JogoIframe {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  iframe_url: string;
}

const JogoIframe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jogo, setJogo] = useState<JogoIframe | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("jogos_iframe")
        .select("*")
        .eq("id", id)
        .single();
      setJogo(data as JogoIframe | null);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!jogo) {
    return (
      <Layout>
        <div className="text-center py-20 space-y-4">
          <p className="text-muted-foreground font-mono text-sm">Jogo não encontrado</p>
          <Button variant="outline" onClick={() => navigate("/jogos")}>Voltar aos jogos</Button>
        </div>
      </Layout>
    );
  }

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-lg">{jogo.icone || "🎮"}</span>
            <span className="font-mono text-sm font-medium">{jogo.nome}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFullscreen(false)} className="gap-1.5">
            <Minimize2 className="h-4 w-4" /> Sair
          </Button>
        </div>
        <iframe
          src={jogo.iframe_url}
          className="flex-1 w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          allowFullScreen
          title={jogo.nome}
        />
      </div>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-4 pb-20"
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/jogos")} className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Jogos
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFullscreen(true)} className="gap-1.5 text-xs">
            <Maximize2 className="h-3.5 w-3.5" /> Tela cheia
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-2xl">{jogo.icone || "🎮"}</span>
          <div>
            <h1 className="text-lg font-bold font-mono">{jogo.nome}</h1>
            {jogo.descricao && <p className="text-xs text-muted-foreground">{jogo.descricao}</p>}
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-border bg-card">
          <iframe
            src={jogo.iframe_url}
            className="w-full border-0"
            style={{ height: "70vh" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            allowFullScreen
            title={jogo.nome}
          />
        </div>
      </motion.div>
    </Layout>
  );
};

export default JogoIframe;
