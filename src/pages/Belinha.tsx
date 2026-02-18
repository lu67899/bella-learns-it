import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Trash2, Copy, Check, MessageSquarePlus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StoryRing, BelinhaStoriesViewer, useBelinhaStories } from "@/components/BelinhaStories";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/belinha-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || "Erro ao conectar com a Belinha");
    return;
  }

  if (!resp.body) {
    onError("Sem resposta da Belinha");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {}
    }
  }

  onDone();
}

const CopyButton = ({ text, label = "Copiar" }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      aria-label={label}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado!" : label}
    </button>
  );
};

const CodeBlock = ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
  const code = typeof children === "object" && children !== null
    ? (children as React.ReactElement<{ children?: string }>)?.props?.children || ""
    : String(children || "");
  const text = String(code).replace(/\n$/, "");
  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={text} label="Copiar código" />
      </div>
      <pre {...props}>{children}</pre>
    </div>
  );
};


const BelinhaAvatar = ({ avatarUrl, size = "sm" }: { avatarUrl: string | null; size?: "sm" | "lg" | "xl" }) => {
  const dims = size === "xl" ? "h-20 w-20" : size === "lg" ? "h-12 w-12" : "h-7 w-7";
  const iconDims = size === "xl" ? "h-8 w-8" : size === "lg" ? "h-6 w-6" : "h-3.5 w-3.5";
  if (avatarUrl) {
    return <img src={avatarUrl} alt="Belinha" className={`${dims} rounded-full object-cover shrink-0`} />;
  }
  return (
    <div className={`flex ${dims} shrink-0 items-center justify-center rounded-full bg-primary/20`}>
      <Bot className={`${iconDims} text-primary`} />
    </div>
  );
};

const Belinha = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = localStorage.getItem("belinha-chat");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [recado, setRecado] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const { hasStories } = useBelinhaStories();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("assistant_config").select("avatar_url, recado").eq("id", 1).single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        if (data?.recado) setRecado(data.recado);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("belinha-chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${msg}` }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Erro inesperado. Tente novamente." }]);
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-2rem)] overflow-x-hidden w-full min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <BackButton to="/" label="" />
            <StoryRing
              avatarUrl={avatarUrl}
              hasStories={hasStories}
              onClick={() => hasStories ? setShowStories(true) : setShowProfile(true)}
              size="lg"
            />
            <button onClick={() => setShowProfile(true)} className="text-left hover:opacity-80 transition-opacity">
              <h1 className="font-mono font-bold text-lg">Belinha</h1>
              <p className="text-[10px] text-muted-foreground">Toque para ver informações</p>
            </button>
          </div>
          {messages.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <MessageSquarePlus className="h-3.5 w-3.5" /> Novo chat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[280px] p-5 backdrop-blur-xl">
                <AlertDialogHeader className="flex flex-col items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </div>
                  <AlertDialogTitle className="text-sm font-semibold text-center">Novo chat</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs text-center">
                    A conversa atual será apagada. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
                  <AlertDialogCancel className="h-8 text-xs flex-1 mt-0">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearChat} className="h-8 text-xs flex-1 bg-destructive hover:bg-destructive/90">
                    Apagar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Profile Dialog */}
        <Dialog open={showProfile} onOpenChange={setShowProfile}>
          <DialogContent className="max-w-sm p-0 overflow-hidden border-border">
            <div className="bg-gradient-to-b from-primary/10 to-transparent pt-10 pb-6 flex flex-col items-center gap-4">
              <BelinhaAvatar avatarUrl={avatarUrl} size="xl" />
              <div className="text-center space-y-1">
                <h2 className="font-mono font-bold text-2xl">Belinha</h2>
                <p className="text-xs text-muted-foreground">Assistente de estudos</p>
              </div>
            </div>
            <div className="px-5 pb-6 space-y-3">
              <div className="rounded-xl bg-secondary/40 p-4">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Recado</p>
                <p className="text-sm leading-relaxed">
                  {recado || "Olá! Estou aqui para te ajudar nos estudos 💜"}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ minHeight: 0 }}>
          <div className="space-y-6 pb-4">
            {/* Recado inicial */}
            {messages.length === 0 && recado && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">{recado}</p>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={msg.role === "user" ? "flex justify-end" : ""}
                >
                  {msg.role === "assistant" ? (
                    <div className="min-w-0 group/msg">
                      <div className="belinha-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ pre: CodeBlock }}>{msg.content}</ReactMarkdown>
                      </div>
                      <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity mt-1.5">
                        <CopyButton text={msg.content} label="Copiar" />
                      </div>
                    </div>
                  ) : (
                    <div className="inline-block bg-primary text-primary-foreground rounded-2xl px-4 py-2 max-w-[85%]">
                      <p className="text-[13px] whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="pt-3 pb-1 border-t border-border shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta..."
              disabled={isLoading}
              className="flex-1 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              name="belinha-chat-input"
              data-1p-ignore
              data-lpignore="true"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
      <BelinhaStoriesViewer open={showStories} onClose={() => setShowStories(false)} />
    </Layout>
  );
};

export default Belinha;
