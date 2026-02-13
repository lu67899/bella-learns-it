import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ResumoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resumo, setResumo] = useState<{ id: string; materia: string; titulo: string; conteudo: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from("resumos").select("*").eq("id", id!).single();
      if (error) {
        toast({ title: "Resumo não encontrado", variant: "destructive" });
        navigate("/resumos");
      } else {
        setResumo(data);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/resumos")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar aos resumos
        </Button>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : resumo ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div
              className="relative rounded-sm overflow-hidden"
              style={{
                background: "hsl(240 12% 14%)",
                boxShadow: "4px 4px 20px rgba(0,0,0,0.4), inset 0 0 60px rgba(0,0,0,0.1)",
              }}
            >
              {/* Margem esquerda do caderno */}
              <div className="absolute left-10 top-0 bottom-0 w-px" style={{ background: "hsl(0 50% 45% / 0.4)" }} />
              <div className="absolute left-[42px] top-0 bottom-0 w-px" style={{ background: "hsl(0 50% 45% / 0.25)" }} />

              {/* Furos do caderno */}
              <div className="absolute left-3 top-8 w-3 h-3 rounded-full border-2" style={{ borderColor: "hsl(var(--muted-foreground) / 0.3)" }} />
              <div className="absolute left-3 top-1/3 w-3 h-3 rounded-full border-2" style={{ borderColor: "hsl(var(--muted-foreground) / 0.3)" }} />
              <div className="absolute left-3 top-2/3 w-3 h-3 rounded-full border-2" style={{ borderColor: "hsl(var(--muted-foreground) / 0.3)" }} />

              <div className="pl-14 pr-6 py-6">
                {/* Matéria como "escrita à mão" no topo */}
                <div
                  className="text-xs tracking-widest uppercase mb-1"
                  style={{
                    color: "hsl(var(--primary))",
                    fontFamily: "'Caveat', cursive",
                    fontSize: "14px",
                    letterSpacing: "2px",
                  }}
                >
                  {resumo.materia}
                </div>

                {/* Título */}
                <h1
                  className="font-bold mb-6 pb-2"
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "28px",
                    color: "hsl(var(--foreground))",
                    borderBottom: "1px solid hsl(var(--border))",
                  }}
                >
                  {resumo.titulo}
                </h1>

                {/* Conteúdo com linhas de caderno */}
                <div
                  className="whitespace-pre-wrap"
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "17px",
                    lineHeight: "2em",
                    color: "hsl(var(--foreground) / 0.85)",
                    backgroundImage: "repeating-linear-gradient(transparent, transparent 1.95em, hsl(var(--border) / 0.4) 1.95em, hsl(var(--border) / 0.4) 2em)",
                    backgroundSize: "100% 2em",
                    backgroundPositionY: "0.05em",
                  }}
                >
                  {resumo.conteudo}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </div>
    </Layout>
  );
};

export default ResumoDetalhe;
