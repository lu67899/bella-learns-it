import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import BackButton from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";

interface AppLog {
  id: string;
  created_at: string;
  level: string;
  tag: string | null;
  message: string;
  context: Record<string, unknown> | null;
  platform: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logsTable = () => (supabase as any).from("app_logs");

export default function AdminLogs() {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await logsTable()
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs(data ?? []);
    setLoading(false);
  };

  const clearLogs = async () => {
    await logsTable().delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setLogs([]);
  };

  useEffect(() => { fetchLogs(); }, []);

  const levelColor: Record<string, string> = {
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    warn:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    info:  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <BackButton />
          <h1 className="text-lg font-bold">App Logs</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchLogs}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Atualizar
            </Button>
            <Button size="sm" variant="destructive" onClick={clearLogs}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
          </div>
        </div>

        {loading && <p className="text-muted-foreground text-sm text-center py-8">Carregando logs...</p>}

        {!loading && logs.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">Nenhum log registrado.</p>
        )}

        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-border/40 bg-card p-3 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-[10px] px-1.5 py-0 border ${levelColor[log.level] ?? "bg-muted"}`}>
                  {log.level.toUpperCase()}
                </Badge>
                {log.platform && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{log.platform}</Badge>
                )}
                {log.tag && <span className="text-[10px] font-mono text-primary">{log.tag}</span>}
                <span className="text-[10px] text-muted-foreground ml-auto font-mono">
                  {new Date(log.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="text-xs text-foreground font-mono leading-relaxed break-all">{log.message}</p>
              {log.context && (
                <pre className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2 overflow-x-auto">
                  {JSON.stringify(log.context, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
