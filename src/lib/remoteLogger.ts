/**
 * remoteLogger — envia logs automaticamente para a tabela `app_logs` no Supabase.
 * Também mantém o console.log/warn/error original.
 */
import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

type LogLevel = "info" | "warn" | "error";

const platform = Capacitor.isNativePlatform()
  ? Capacitor.getPlatform()   // 'android' | 'ios'
  : "web";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logsTable = () => (supabase as any).from("app_logs");

async function send(
  level: LogLevel,
  tag: string,
  message: string,
  context?: Record<string, unknown>
) {
  try {
    await logsTable().insert([{
      level,
      tag,
      message: String(message).slice(0, 2000),
      context: context ?? null,
      platform,
    }]);
  } catch {
    // silencioso — não logar falha de log
  }
}

export const remoteLog = {
  info: (tag: string, msg: string, ctx?: Record<string, unknown>) => {
    console.log(`${tag} ${msg}`, ctx ?? "");
    void send("info", tag, msg, ctx);
  },
  warn: (tag: string, msg: string, ctx?: Record<string, unknown>) => {
    console.warn(`${tag} ${msg}`, ctx ?? "");
    void send("warn", tag, msg, ctx);
  },
  error: (tag: string, msg: string, ctx?: Record<string, unknown>) => {
    console.error(`${tag} ${msg}`, ctx ?? "");
    void send("error", tag, msg, ctx);
  },
};

/**
 * Intercepta console.error e console.warn globalmente e espelha no Supabase.
 * Chamar uma vez no main.tsx.
 */
export function installGlobalLogInterceptor() {
  const origError = console.error.bind(console);
  const origWarn  = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    origError(...args);
    void send("error", "[global]", args.map(String).join(" "));
  };

  console.warn = (...args: unknown[]) => {
    origWarn(...args);
    void send("warn", "[global]", args.map(String).join(" "));
  };
}
