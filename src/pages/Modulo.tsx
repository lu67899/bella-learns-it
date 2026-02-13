import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, ArrowLeft, Loader2, CheckCircle2, Circle } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface Modulo {
  id: string;
  nome: string;
  descricao: string | null;
}

interface Topico {
  id: string;
  titulo: string;
  conteudo: string;
  ordem: number;
}

const ModuloPage = () => {
  const { id } = useParams<{ id: string }>();
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [selectedTopico, setSelectedTopico] = useState<Topico | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      const [mRes, tRes, pRes] = await Promise.all([
        supabase.from("modulos").select("*").eq("id", id!).single(),
        supabase.from("modulo_topicos").select("*").eq("modulo_id", id!).order("ordem"),
        supabase.from("topico_progresso").select("topico_id"),
      ]);
      if (mRes.data) setModulo(mRes.data);
      if (tRes.data) {
        setTopicos(tRes.data);
        if (tRes.data.length > 0) setSelectedTopico(tRes.data[0]);
      }
      if (pRes.data) {
        const topicIds = new Set(tRes.data?.map((t) => t.id) || []);
        setCompletedIds(new Set(pRes.data.filter((p) => topicIds.has(p.topico_id)).map((p) => p.topico_id)));
      }
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  const toggleComplete = async (topicoId: string) => {
    if (completedIds.has(topicoId)) {
      await supabase.from("topico_progresso").delete().eq("topico_id", topicoId);
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(topicoId);
        return next;
      });
    } else {
      await supabase.from("topico_progresso").insert({ topico_id: topicoId });
      setCompletedIds((prev) => new Set(prev).add(topicoId));
    }
  };

  const progressPercent = topicos.length > 0 ? (completedIds.size / topicos.length) * 100 : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!modulo) {
    return (
      <Layout>
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">Módulo não encontrado</p>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> {modulo.nome}
          </h1>
          {modulo.descricao && <p className="text-sm text-muted-foreground">{modulo.descricao}</p>}
          
          {/* Progress bar */}
          {topicos.length > 0 && (
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progresso do módulo</span>
                <span className="font-mono text-primary">{completedIds.size}/{topicos.length} tópicos</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}
        </motion.div>

        {topicos.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              Nenhum tópico cadastrado neste módulo ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
            {/* Sidebar - topic list */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-3">Tópicos</p>
              {topicos.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopico(t)}
                  className={`w-full text-left rounded-lg px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                    selectedTopico?.id === t.id
                      ? "bg-primary/15 text-primary border-glow"
                      : "bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {completedIds.has(t.id) ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-mono font-bold">
                      {i + 1}
                    </span>
                  )}
                  <span className="truncate font-mono">{t.titulo}</span>
                </button>
              ))}
            </motion.div>

            {/* Content area */}
            <motion.div
              key={selectedTopico?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="text-primary border-primary/30 font-mono">
                      {selectedTopico?.titulo}
                    </Badge>
                    {selectedTopico && (
                      <Button
                        variant={completedIds.has(selectedTopico.id) ? "default" : "outline"}
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => toggleComplete(selectedTopico.id)}
                      >
                        {completedIds.has(selectedTopico.id) ? (
                          <><CheckCircle2 className="h-3.5 w-3.5" /> Concluído</>
                        ) : (
                          <><Circle className="h-3.5 w-3.5" /> Marcar como concluído</>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none">
                    {selectedTopico?.conteudo.split("\n").map((line, i) => (
                      <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-3">
                        {line}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={topicos.indexOf(selectedTopico!) <= 0}
                  onClick={() => {
                    const idx = topicos.indexOf(selectedTopico!);
                    if (idx > 0) setSelectedTopico(topicos[idx - 1]);
                  }}
                  className="gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Anterior
                </Button>
                <Button
                  size="sm"
                  disabled={topicos.indexOf(selectedTopico!) >= topicos.length - 1}
                  onClick={() => {
                    const idx = topicos.indexOf(selectedTopico!);
                    if (idx < topicos.length - 1) setSelectedTopico(topicos[idx + 1]);
                  }}
                  className="gap-1"
                >
                  Próximo <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ModuloPage;
