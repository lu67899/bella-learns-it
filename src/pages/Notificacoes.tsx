import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInHours } from "date-fns";

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  link: string | null;
  lida: boolean;
  created_at: string;
}

const Notificacoes = () => {
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [filtro, setFiltro] = useState<"nao_lidas" | "todas">("nao_lidas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from("notificacoes")
        .select("*")
        .neq("tipo", "certificado")
        .neq("tipo", "resgate")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setNotificacoes(data);
      setLoading(false);
    };
    fetchNotifs();
  }, []);

  const marcarLida = async (notif: Notificacao) => {
    if (!notif.lida) {
      await supabase.from("notificacoes").update({ lida: true }).eq("id", notif.id);
      setNotificacoes((prev) => prev.map((n) => (n.id === notif.id ? { ...n, lida: true } : n)));
    }
    if (notif.link) navigate(notif.link);
  };

  const marcarTodasLidas = async () => {
    const ids = notificacoes.filter((n) => !n.lida).map((n) => n.id);
    if (ids.length > 0) {
      await supabase.from("notificacoes").update({ lida: true }).in("id", ids);
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    }
  };

  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const filtered = filtro === "nao_lidas" ? notificacoes.filter((n) => !n.lida) : notificacoes;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffH = differenceInHours(now, date);
    if (diffH < 1) return "agora";
    if (diffH < 24) return `${diffH}h atrás`;
    return format(date, "dd/MM HH:mm");
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <h1 className="text-2xl font-mono font-bold">Notificações</h1>
                <p className="text-sm text-muted-foreground">
                  {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? "s" : ""}` : "Tudo em dia!"}
                </p>
              </div>
            </div>
            {naoLidas > 0 && (
              <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={marcarTodasLidas}>
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <button
            onClick={() => setFiltro("nao_lidas")}
            className={`text-xs font-mono px-3 py-1.5 rounded-full transition-colors ${filtro === "nao_lidas" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            Não lidas {naoLidas > 0 && `(${naoLidas})`}
          </button>
          <button
            onClick={() => setFiltro("todas")}
            className={`text-xs font-mono px-3 py-1.5 rounded-full transition-colors ${filtro === "todas" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            Todas
          </button>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
          ) : filtered.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {filtro === "nao_lidas" ? "Nenhuma notificação não lida 🎉" : "Sem notificações"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => marcarLida(n)}
                  className={`w-full text-left rounded-lg border transition-all ${!n.lida ? "bg-primary/5 border-primary/20 hover:border-primary/40" : "bg-card border-border hover:border-border/80"}`}
                >
                  <div className="p-4 flex items-start gap-3">
                    {!n.lida && <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-mono ${!n.lida ? "font-semibold" : "text-muted-foreground"}`}>
                          {n.titulo}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {formatTime(n.created_at)}
                        </span>
                      </div>
                      {n.mensagem && (
                        <p className="text-xs text-muted-foreground mt-1">{n.mensagem}</p>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </Layout>
  );
};

export default Notificacoes;
