import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, CheckCircle2, Flame, Calendar, ChevronDown, ChevronUp, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import BackButton from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DesafioSemanal {
  id: string;
  pergunta: string;
  opcoes: string[];
  correta: number;
  moedas: number;
  created_at: string;
}

interface Resposta {
  desafio_id: string;
  resposta_usuario: number;
  created_at: string;
}

const Desafios = () => {
  const [desafios, setDesafios] = useState<DesafioSemanal[]>([]);
  const [respostas, setRespostas] = useState<Map<string, Resposta>>(new Map());
  const [showHistorico, setShowHistorico] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const [desafiosRes, respostasRes] = await Promise.all([
        supabase.from("desafios_semanais").select("*").order("created_at", { ascending: false }),
        supabase.from("desafio_respostas").select("desafio_id, resposta_usuario, created_at"),
      ]);
      if (desafiosRes.data) setDesafios(desafiosRes.data as DesafioSemanal[]);
      if (respostasRes.data) {
        const map = new Map<string, Resposta>();
        (respostasRes.data as Resposta[]).forEach((r) => map.set(r.desafio_id, r));
        setRespostas(map);
      }
    };
    load();
  }, []);

  // Desafio de hoje: pega o mais recente cujo created_at é hoje, ou o mais recente geral
  const desafioHoje = useMemo(() => {
    const today = startOfDay(new Date());
    const todayChallenge = desafios.find((d) => isSameDay(new Date(d.created_at), today));
    return todayChallenge || desafios[0] || null;
  }, [desafios]);

  // Histórico: todos menos o de hoje
  const historico = useMemo(() => {
    if (!desafioHoje) return desafios;
    return desafios.filter((d) => d.id !== desafioHoje.id);
  }, [desafios, desafioHoje]);

  // Calcular streak: dias consecutivos com pelo menos 1 resposta
  const streak = useMemo(() => {
    if (respostas.size === 0) return 0;
    const dates = Array.from(respostas.values())
      .map((r) => startOfDay(new Date(r.created_at)).getTime())
      .sort((a, b) => b - a);
    const uniqueDates = [...new Set(dates)];

    let count = 0;
    const today = startOfDay(new Date()).getTime();
    const yesterday = startOfDay(subDays(new Date(), 1)).getTime();

    // Streak começa de hoje ou ontem
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let expected = uniqueDates[0];
    for (const date of uniqueDates) {
      if (date === expected) {
        count++;
        expected = startOfDay(subDays(new Date(date), 1)).getTime();
      } else {
        break;
      }
    }
    return count;
  }, [respostas]);

  // Mini-calendário dos últimos 7 dias
  const weekDays = useMemo(() => {
    const today = new Date();
    const respostaDates = new Set(
      Array.from(respostas.values()).map((r) => startOfDay(new Date(r.created_at)).getTime())
    );
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i);
      const dayStart = startOfDay(day).getTime();
      return {
        date: day,
        label: format(day, "EEE", { locale: ptBR }).slice(0, 3),
        dayNum: format(day, "d"),
        completed: respostaDates.has(dayStart),
        isToday: isSameDay(day, today),
      };
    });
  }, [respostas]);

  const responder = async (desafioId: string, opcaoIdx: number) => {
    if (respostas.has(desafioId) || !user) return;

    await supabase.from("desafio_respostas").insert({
      user_id: user.id,
      desafio_id: desafioId,
      resposta_usuario: opcaoIdx,
    });
    setRespostas((prev) => new Map(prev).set(desafioId, {
      desafio_id: desafioId,
      resposta_usuario: opcaoIdx,
      created_at: new Date().toISOString(),
    }));

    const desafio = desafios.find((d) => d.id === desafioId);
    if (desafio && opcaoIdx === desafio.correta) {
      toast.success(`Resposta correta! +${desafio.moedas} moedas 🎉`);
    } else {
      toast.error("Resposta incorreta 😕");
    }
  };

  const respondidos = desafios.filter((d) => respostas.has(d.id)).length;
  const acertos = desafios.filter((d) => respostas.has(d.id) && respostas.get(d.id)?.resposta_usuario === d.correta).length;

  const renderDesafioCard = (desafio: DesafioSemanal, highlight = false) => {
    const respondida = respostas.has(desafio.id);
    const respostaUsuario = respostas.get(desafio.id)?.resposta_usuario;
    const acertou = respondida && respostaUsuario === desafio.correta;

    return (
      <Card key={desafio.id} className={`bg-card border-border ${highlight ? "border-primary/30 border-glow" : ""}`}>
        <CardContent className="p-5 space-y-3">
          {highlight && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
                🎯 Desafio de Hoje
              </span>
              {!respondida && (
                <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                  <Coins className="h-3 w-3" /> +{desafio.moedas}
                </span>
              )}
              {respondida && (
                <span className={`text-xs font-mono font-bold ${acertou ? "text-primary" : "text-destructive"}`}>
                  {acertou ? "✅ Correto!" : "❌ Errou"}
                </span>
              )}
            </div>
          )}
          <p className="font-mono font-semibold text-sm">{desafio.pergunta}</p>
          <div className="grid grid-cols-1 gap-2">
            {desafio.opcoes.map((opcao, opIdx) => {
              const isCorreta = opIdx === desafio.correta;
              const isEscolhida = opIdx === respostaUsuario;
              let btnClass = "text-left justify-start h-auto py-3 px-4 text-sm font-mono";

              if (respondida) {
                if (isCorreta) {
                  btnClass += " border-primary bg-primary/10 text-primary";
                } else if (isEscolhida && !isCorreta) {
                  btnClass += " border-destructive bg-destructive/10 text-destructive";
                }
              }

              return (
                <Button
                  key={opIdx}
                  variant="outline"
                  className={btnClass}
                  disabled={respondida}
                  onClick={() => responder(desafio.id, opIdx)}
                >
                  {respondida && isCorreta && <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />}
                  {opcao}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-5">
          <BackButton to="/" />
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" /> Desafio Diário
            </h1>
            <p className="text-sm text-muted-foreground">Responda todo dia e mantenha sua sequência!</p>
          </div>
        </div>

        {/* Streak + Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${streak > 0 ? "bg-orange-500/15" : "bg-muted"}`}>
                <Flame className={`h-6 w-6 ${streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-foreground">{streak}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  {streak === 1 ? "dia seguido" : "dias seguidos"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-foreground">{acertos}/{respondidos}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">acertos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mini-calendário semanal */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Últimos 7 dias</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-muted-foreground capitalize">{day.label}</span>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-mono font-bold transition-colors ${
                      day.completed
                        ? "bg-primary/20 text-primary ring-1 ring-primary/30"
                        : day.isToday
                        ? "bg-muted ring-1 ring-border text-foreground"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {day.completed ? "✓" : day.dayNum}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Desafio de Hoje */}
        {desafioHoje ? (
          renderDesafioCard(desafioHoje, true)
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              Nenhum desafio disponível ainda. Aguarde o admin adicionar! 🎯
            </CardContent>
          </Card>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowHistorico(!showHistorico)}
              className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {showHistorico ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Desafios anteriores ({historico.length})
            </button>
            {showHistorico && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                {historico.map((d) => renderDesafioCard(d))}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Desafios;
