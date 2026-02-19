import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

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
        <div className="mb-5">
          <BackButton to="/resumos" label="Voltar aos resumos" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : resumo ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
            <div>
              <p className="text-xs text-primary font-mono uppercase tracking-wider">{resumo.materia}</p>
              <h1 className="text-2xl font-mono font-bold mt-1">{resumo.titulo}</h1>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 md:p-8">
              <article className="prose prose-sm dark:prose-invert max-w-none
                prose-headings:font-mono prose-headings:text-foreground prose-headings:font-bold
                prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
                prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                prose-p:text-foreground/85 prose-p:leading-relaxed prose-p:mb-3
                prose-li:text-foreground/85 prose-li:leading-relaxed
                prose-strong:text-primary prose-strong:font-semibold
                prose-ul:my-3 prose-ol:my-3
                prose-table:border-collapse prose-table:w-full prose-table:my-4
                prose-th:bg-secondary/50 prose-th:text-foreground prose-th:text-left prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-border prose-th:text-xs prose-th:font-mono
                prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-border prose-td:text-sm
                prose-code:bg-secondary/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-code:text-xs prose-code:font-mono
                prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4
                prose-hr:border-border
              ">
                <ReactMarkdown>{resumo.conteudo}</ReactMarkdown>
              </article>
            </div>
          </motion.div>
        ) : null}
      </div>
    </Layout>
  );
};

export default ResumoDetalhe;
