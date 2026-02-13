import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface DesafioSemanal {
  id: string;
  pergunta: string;
  opcoes: string[];
  correta: number;
  respondida: boolean;
  resposta_usuario: number | null;
  created_at: string;
}

const Desafios = () => {
  const [desafios, setDesafios] = useState<DesafioSemanal[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("desafios_semanais").select("*").order("created_at", { ascending: false });
      if (data) setDesafios(data as DesafioSemanal[]);
    };
    load();
  }, []);

  const responder = async (desafioId: string, opcaoIdx: number) => {
    const desafio = desafios.find((d) => d.id === desafioId);
    if (!desafio || desafio.respondida) return;

    await supabase.from("desafios_semanais").update({ respondida: true, resposta_usuario: opcaoIdx }).eq("id", desafioId);
    setDesafios((prev) =>
      prev.map((d) => (d.id === desafioId ? { ...d, respondida: true, resposta_usuario: opcaoIdx } : d))
    );

    if (opcaoIdx === desafio.correta) {
      toast.success("Resposta correta! 🎉");
    } else {
      toast.error("Resposta incorreta 😕");
    }
  };

  const respondidos = desafios.filter((d) => d.respondida).length;
  const acertos = desafios.filter((d) => d.respondida && d.resposta_usuario === d.correta).length;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-mono font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" /> Desafios da Semana
            </h1>
            <p className="text-sm text-muted-foreground">Responda as perguntas e teste seus conhecimentos</p>
          </div>
        </div>

        {/* Score card */}
        <Card className="bg-card border-border border-glow">
          <CardContent className="p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-mono">Respondidos</span>
              <span className="font-mono text-primary font-bold">{respondidos}/{desafios.length}</span>
            </div>
            <Progress value={desafios.length > 0 ? (respondidos / desafios.length) * 100 : 0} className="h-3" />
            {respondidos > 0 && (
              <p className="text-xs text-muted-foreground font-mono text-right">
                {acertos} acerto{acertos !== 1 ? "s" : ""} de {respondidos}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Questions */}
        {desafios.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              Nenhum desafio disponível ainda. Aguarde o admin adicionar! 🎯
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {desafios.map((desafio, idx) => (
              <Card key={desafio.id} className="bg-card border-border">
                <CardContent className="p-5 space-y-3">
                  <p className="font-mono font-semibold text-sm">
                    {idx + 1}. {desafio.pergunta}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {desafio.opcoes.map((opcao, opIdx) => {
                      const isRespondida = desafio.respondida;
                      const isCorreta = opIdx === desafio.correta;
                      const isEscolhida = opIdx === desafio.resposta_usuario;
                      let btnClass = "text-left justify-start h-auto py-3 px-4 text-sm font-mono";

                      if (isRespondida) {
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
                          disabled={isRespondida}
                          onClick={() => responder(desafio.id, opIdx)}
                        >
                          {isRespondida && isCorreta && <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />}
                          {opcao}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Desafios;
