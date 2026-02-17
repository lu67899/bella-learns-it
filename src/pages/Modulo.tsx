import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, ArrowLeft, Loader2, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import BackButton from "@/components/BackButton";
import ReactMarkdown from "react-markdown";
import { Layout } from "@/components/Layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Modulo {
  id: string;
  nome: string;
  descricao: string | null;
  curso_id: string | null;
  ordem: number;
}

interface Topico {
  id: string;
  titulo: string;
  conteudo: string;
  ordem: number;
  moedas: number;
}

interface NextModulo {
  id: string;
  nome: string;
}

const ModuloPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [selectedTopico, setSelectedTopico] = useState<Topico | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [nextModulo, setNextModulo] = useState<NextModulo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [mRes, tRes, pRes] = await Promise.all([
        supabase.from("modulos").select("*").eq("id", id!).single(),
        supabase.from("modulo_topicos").select("*").eq("modulo_id", id!).order("ordem"),
        supabase.from("topico_progresso").select("topico_id"),
      ]);
      if (mRes.data) {
        setModulo(mRes.data);
        // Fetch next module in same course
        if (mRes.data.curso_id) {
          const { data: nextMods } = await supabase
            .from("modulos")
            .select("id, nome, ordem")
            .eq("curso_id", mRes.data.curso_id)
            .gt("ordem", mRes.data.ordem)
            .order("ordem")
            .limit(1);
          setNextModulo(nextMods && nextMods.length > 0 ? nextMods[0] : null);
        }
      }
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

  const markComplete = async (topico: Topico) => {
    if (completedIds.has(topico.id)) return;

    const { data: existing } = await supabase
      .from("topico_progresso")
      .select("id")
      .eq("topico_id", topico.id)
      .eq("user_id", user!.id);
    const isFirstTime = !existing || existing.length === 0;

    await supabase.from("topico_progresso").insert({ topico_id: topico.id, user_id: user!.id });
    setCompletedIds((prev) => new Set(prev).add(topico.id));

    if (isFirstTime && topico.moedas > 0) {
      toast({ title: `🪙 +${topico.moedas} moedas!`, description: "Você ganhou moedas por concluir este tópico!" });
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
          <BackButton to="/" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <BackButton to={modulo.curso_id ? `/curso/${modulo.curso_id}` : "/"} label="Voltar ao curso" />
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" /> {modulo.nome}
            </h1>
            {modulo.descricao && <p className="text-sm text-muted-foreground mt-1">{modulo.descricao}</p>}
          </div>
          
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
              {topicos.map((t, i) => {
                const isUnlocked = i === 0 || completedIds.has(topicos[i - 1].id);
                return (
                  <button
                    key={t.id}
                    onClick={() => isUnlocked && setSelectedTopico(t)}
                    disabled={!isUnlocked}
                    className={`w-full text-left rounded-lg px-4 py-3 text-sm transition-all flex items-center gap-3 ${
                      !isUnlocked
                        ? "bg-card/50 text-muted-foreground/40 cursor-not-allowed opacity-50"
                        : selectedTopico?.id === t.id
                          ? "bg-primary/15 text-primary border-glow"
                          : "bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {completedIds.has(t.id) ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                    ) : !isUnlocked ? (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary/50 text-xs font-mono font-bold">
                        🔒
                      </span>
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-mono font-bold">
                        {i + 1}
                      </span>
                    )}
                    <span className="truncate font-mono">{t.titulo}</span>
                  </button>
                );
              })}
            </motion.div>

            {/* Content area */}
            <motion.div
              key={selectedTopico?.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              onAnimationStart={() => window.scrollTo({ top: 0, behavior: "instant" })}
            >
              <Card className="bg-card border-border">
                <CardContent className="p-6 md:p-8">
                  <div className="mb-4">
                    <Badge variant="outline" className="text-primary border-primary/30 font-mono">
                      {selectedTopico?.titulo}
                    </Badge>
                  </div>
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
                    <ReactMarkdown>{selectedTopico?.conteudo || ""}</ReactMarkdown>
                  </article>
                  {selectedTopico && (
                    <div className="mt-6 pt-4 border-t border-border">
                      {completedIds.has(selectedTopico.id) ? (
                        <Button variant="default" size="sm" className="gap-1.5 text-xs w-full" disabled>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs w-full">
                              <Circle className="h-3.5 w-3.5" /> Marcar como concluído
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[280px] rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/5 p-0 overflow-hidden">
                            <div className="flex flex-col items-center text-center px-6 pt-6 pb-4">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 ring-1 ring-primary/20">
                                <Circle className="h-4 w-4 text-primary" />
                              </div>
                              <AlertDialogHeader className="space-y-1">
                                <AlertDialogTitle className="text-sm font-bold tracking-tight">
                                  Confirmar conclusão
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-xs text-muted-foreground/70 leading-relaxed">
                                  Essa ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                            </div>
                            <AlertDialogFooter className="flex-row gap-2 border-t border-border/30 bg-muted/20 px-4 py-3 sm:space-x-0">
                              <AlertDialogCancel className="flex-1 m-0 h-8 text-xs rounded-lg border-border/50 bg-transparent hover:bg-muted/50 font-medium">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => markComplete(selectedTopico)}
                                className="flex-1 m-0 h-8 text-xs rounded-lg font-medium shadow-lg shadow-primary/20"
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
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

              {/* Next module card when all topics completed */}
              {topicos.length > 0 && completedIds.size === topicos.length && nextModulo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <Link to={`/modulo/${nextModulo.id}`}>
                    <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <div>
                            <p className="text-xs text-muted-foreground font-mono">Módulo concluído! Próximo:</p>
                            <p className="text-sm font-mono font-semibold text-foreground">{nextModulo.nome}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ModuloPage;
