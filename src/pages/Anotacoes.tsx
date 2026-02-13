import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StickyNote, Search, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Anotacao {
  id: string;
  titulo: string;
  conteudo: string;
  tags: string[] | null;
  materia: string | null;
  created_at: string;
}

const Anotacoes = () => {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.from("anotacoes").select("*").order("created_at", { ascending: false });
      if (error) {
        toast({ title: "Erro ao carregar anotações", variant: "destructive" });
      } else {
        setAnotacoes(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtradas = anotacoes.filter((a) =>
    a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    a.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
    (a.tags || []).some((t) => t.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
            <StickyNote className="h-6 w-6 text-neon-green" /> Anotações
          </h1>
          <p className="text-sm text-muted-foreground">Suas notas de estudo</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar anotações..." className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <StickyNote className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma anotação encontrada</p>
            <p className="text-xs text-muted-foreground/60">Adicione anotações pelo painel admin</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtradas.map((a) => (
              <Card key={a.id} className="bg-card border-border hover:border-neon-green/30 transition-all">
                <CardContent className="p-5 space-y-3">
                  <div>
                    <h3 className="font-mono font-semibold text-sm">{a.titulo}</h3>
                    {a.materia && <p className="text-[10px] text-primary">{a.materia}</p>}
                    <p className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">{a.conteudo}</p>
                  {a.tags && a.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {a.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Anotacoes;
