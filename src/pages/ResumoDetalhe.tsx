import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
              <Badge variant="outline" className="text-primary border-primary/30 w-fit">{resumo.materia}</Badge>
              <h1 className="font-mono text-2xl font-bold">{resumo.titulo}</h1>
              <div className="h-px bg-border" />
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                {resumo.conteudo}
              </div>
          </motion.div>
        ) : null}
      </div>
    </Layout>
  );
};

export default ResumoDetalhe;
