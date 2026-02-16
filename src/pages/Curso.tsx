import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, ArrowLeft, Loader2, CheckCircle2, Award, Clock } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CursoDB {
  id: string;
  nome: string;
  descricao: string | null;
}

interface ModuloDB {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  topicos_count: number;
  completed_count: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const CursoPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [curso, setCurso] = useState<CursoDB | null>(null);
  const [modulos, setModulos] = useState<ModuloDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [certStatus, setCertStatus] = useState<string | null>(null); // null = no request, "pendente", "enviado"
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [cursoRes, modRes] = await Promise.all([
        supabase.from("cursos").select("*").eq("id", id!).single(),
        supabase.from("modulos").select("*").eq("curso_id", id!).order("ordem"),
      ]);

      if (cursoRes.data) setCurso(cursoRes.data);

      const moduleIds = (modRes.data || []).map((m: any) => m.id);

      // Only fetch topics for THIS course's modules
      const [topRes, progRes] = moduleIds.length > 0
        ? await Promise.all([
            supabase.from("modulo_topicos").select("modulo_id, id").in("modulo_id", moduleIds),
            supabase.from("topico_progresso").select("topico_id"),
          ])
        : [{ data: [] }, { data: [] }];

      const topicosByModule = new Map<string, string[]>();
      ((topRes as any).data || []).forEach((t: any) => {
        const arr = topicosByModule.get(t.modulo_id) || [];
        arr.push(t.id);
        topicosByModule.set(t.modulo_id, arr);
      });

      // Get all topic IDs for this course to filter progress
      const allTopicIds = new Set<string>();
      topicosByModule.forEach((ids) => ids.forEach((tid) => allTopicIds.add(tid)));

      const completedSet = new Set(
        ((progRes as any).data || [])
          .filter((p: any) => allTopicIds.has(p.topico_id))
          .map((p: any) => p.topico_id)
      );

      const mods = (modRes.data || []).map((m: any) => {
        const topicIds = topicosByModule.get(m.id) || [];
        return {
          ...m,
          topicos_count: topicIds.length,
          completed_count: topicIds.filter((tid: string) => completedSet.has(tid)).length,
        };
      });
      setModulos(mods);

      // Check if user already requested certificate for this course
      if (user) {
        const { data: certSol } = await supabase
          .from("certificado_solicitacoes")
          .select("status")
          .eq("user_id", user.id)
          .eq("curso_id", id!)
          .order("created_at", { ascending: false })
          .limit(1);
        if (certSol && certSol.length > 0) {
          setCertStatus(certSol[0].status);
        }
      }

      setLoading(false);
    };
    if (id) fetchData();
  }, [id, user]);

  const totalTopics = modulos.reduce((sum, m) => sum + m.topicos_count, 0);
  const completedTopics = modulos.reduce((sum, m) => sum + m.completed_count, 0);
  const isCourseComplete = totalTopics > 0 && completedTopics === totalTopics;

  const requestCertificate = async () => {
    if (!user || !curso) return;
    setRequesting(true);
    const { error } = await supabase.from("certificado_solicitacoes").insert({
      user_id: user.id,
      curso_id: curso.id,
      curso_nome: curso.nome,
    });
    if (error) {
      toast.error("Erro ao solicitar certificado");
    } else {
      toast.success("Certificado solicitado! Você será notificado quando estiver pronto.");
      setCertStatus("pendente");
    }
    setRequesting(false);
  };
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!curso) {
    return (
      <Layout>
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">Curso não encontrado</p>
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
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-6">
        <motion.div variants={item} className="space-y-2">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> {curso.nome}
          </h1>
          {curso.descricao && <p className="text-sm text-muted-foreground">{curso.descricao}</p>}
        </motion.div>

        <motion.div variants={item} className="space-y-3">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Módulos</p>
          {modulos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum módulo neste curso.</p>
          ) : (
            <div className="space-y-2">
              {modulos.map((mod, i) => {
                const pct = mod.topicos_count > 0 ? (mod.completed_count / mod.topicos_count) * 100 : 0;
                return (
                  <Link key={mod.id} to={`/modulo/${mod.id}`}>
                    <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-all cursor-pointer">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-mono font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                        {pct === 100 ? <CheckCircle2 className="h-4 w-4 text-primary" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">{mod.nome}</p>
                        {mod.descricao && <p className="text-xs text-muted-foreground truncate">{mod.descricao}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={pct} className="h-1 flex-1" />
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">{Math.round(pct)}%</span>
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Certificate section */}
        {isCourseComplete && (
          <motion.div variants={item}>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                {certStatus === "enviado" ? (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-mono font-medium text-foreground">Certificado disponível!</p>
                      <p className="text-xs text-muted-foreground">Confira na galeria do seu perfil.</p>
                    </div>
                  </div>
                ) : certStatus === "pendente" ? (
                  <div className="flex items-center gap-3">
                    <Clock className="h-8 w-8 text-primary/40 shrink-0" />
                    <div>
                      <p className="text-sm font-mono font-medium text-foreground">Certificado solicitado!</p>
                      <p className="text-xs text-muted-foreground">Aguardando o administrador gerar seu certificado. Você será notificado.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Award className="h-8 w-8 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-mono font-medium text-foreground">🎉 Curso concluído!</p>
                        <p className="text-xs text-muted-foreground">Solicite seu certificado de conclusão.</p>
                      </div>
                    </div>
                    <Button onClick={requestCertificate} disabled={requesting} size="sm" className="gap-1.5 shrink-0">
                      {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                      Gerar Certificado
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default CursoPage;
