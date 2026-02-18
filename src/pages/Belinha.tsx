import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Trash2 } from "lucide-react";

import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

/** Lightweight markdown: bold, italic, inline code only. No external lib. */
const renderSimpleMd = (text: string) => {
  // Escape HTML
  let safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Bold **text** or __text__
  safe = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic *text* or _text_
  safe = safe.replace(/\*(.+?)\*/g, "<em>$1</em>");
  safe = safe.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
  // Inline code `text`
  safe = safe.replace(/`(.+?)`/g, '<code class="bg-secondary/60 px-1 py-0.5 rounded text-xs">$1</code>');
  // Line breaks
  safe = safe.replace(/\n/g, "<br />");
  return safe;
};

const BelinhaAvatar = ({ avatarUrl, size = "sm" }: { avatarUrl: string | null; size?: "sm" | "lg" }) => {
  const dims = size === "lg" ? "h-10 w-10" : "h-7 w-7";
  const iconDims = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
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
  const [messages, setMessages] = useState<Msg[]>([]);
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
        <div className="flex items-center justify-between pb-4">
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
            <Button variant="ghost" size="sm" onClick={clearChat} className="gap-1.5 text-muted-foreground">
              <Trash2 className="h-3.5 w-3.5" /> Limpar
            </Button>
          )}
        </div>

        {/* Profile Dialog */}
        <Dialog open={showProfile} onOpenChange={setShowProfile}>
          <DialogContent className="max-w-sm p-0 overflow-hidden border-border">
            <div className="bg-gradient-to-b from-primary/20 to-transparent pt-8 pb-4 flex flex-col items-center gap-3">
              <BelinhaAvatar avatarUrl={avatarUrl} size="lg" />
              <h2 className="font-mono font-bold text-xl">Belinha</h2>
              <p className="text-xs text-muted-foreground">Assistente de estudos</p>
            </div>
            <div className="px-5 pb-5 space-y-3">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Recado</p>
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
                <div className="flex items-center gap-2 mb-2">
                  <BelinhaAvatar avatarUrl={avatarUrl} />
                  <span className="text-xs font-mono text-muted-foreground">Belinha</span>
                </div>
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <BelinhaAvatar avatarUrl={avatarUrl} />
                        <span className="text-xs font-mono text-muted-foreground">Belinha</span>
                      </div>
                      <div
                        className="text-[13px] leading-[1.7] text-foreground/85 break-words"
                        style={{ overflowWrap: "anywhere" }}
                        dangerouslySetInnerHTML={{ __html: renderSimpleMd(msg.content) }}
                      />
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
                <div className="flex items-center gap-2 mb-1.5">
                  <BelinhaAvatar avatarUrl={avatarUrl} />
                  <span className="text-xs font-mono text-muted-foreground">Belinha</span>
                </div>
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
        <div className="pt-3 border-t border-border">
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
              className="flex-1"
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
