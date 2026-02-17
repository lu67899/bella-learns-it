import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [nomeApp, setNomeApp] = useState("Bella Space");
  const [subtituloApp, setSubtituloApp] = useState("Plataforma de estudos");

  useEffect(() => {
    supabase
      .from("admin_config")
      .select("logo_url, nome_app, subtitulo")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
        if ((data as any)?.nome_app) setNomeApp((data as any).nome_app);
        if ((data as any)?.subtitulo) setSubtituloApp((data as any).subtitulo);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isSignUp && !displayName.trim()) {
      toast.error("Preencha seu nome");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName.trim() },
          },
        });
        if (error) throw error;

        const userId = data.user?.id;
        if (!userId) throw new Error("Erro ao criar conta");

        toast.success("Conta criada com sucesso! 🎉");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Bem-vinda de volta! 💜");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-5 py-6 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)`,
        backgroundSize: '20px 20px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[340px] relative z-10"
      >
        {/* Logo + branding above card */}
        <motion.div
          className="flex flex-col items-center gap-2.5 mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="relative">
            {logoUrl ? (
              <div className="h-14 w-14 rounded-2xl overflow-hidden ring-1 ring-primary/20 shadow-lg shadow-primary/15">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-14 w-14 rounded-2xl bg-primary/10 ring-1 ring-primary/20 shadow-lg shadow-primary/15 flex items-center justify-center">
                <BrainCircuit className="h-7 w-7 text-primary" />
              </div>
            )}
            <motion.div
              className="absolute -top-0.5 -right-0.5"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="h-4 w-4 rounded-full bg-accent/20 ring-1 ring-accent/30 flex items-center justify-center">
                <Sparkles className="h-2 w-2 text-accent" />
              </div>
            </motion.div>
          </div>
          <div className="text-center">
            <h1 className="font-mono text-lg font-bold tracking-tight text-foreground">
              {nomeApp}
            </h1>
            <p className="text-[9px] text-muted-foreground/40 font-mono tracking-[0.2em] uppercase">
              {subtituloApp}
            </p>
          </div>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <Card className="p-0 bg-card/60 backdrop-blur-2xl border-border/20 shadow-2xl shadow-black/40 overflow-hidden rounded-2xl">
            {/* Top accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="px-5 pt-5 pb-2">
              <h2 className="text-base font-mono font-bold text-foreground tracking-tight">
                {isSignUp ? "Criar conta" : "Bem-vinda de volta"}
              </h2>
              <p className="text-[11px] text-muted-foreground/50 mt-0.5 font-mono">
                {isSignUp ? "Comece sua jornada de estudos ✨" : "Continue de onde parou 💜"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-5 pt-3 space-y-3">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] ml-0.5">
                    Nome
                  </label>
                  <Input
                    placeholder="Como quer ser chamada?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={100}
                    className="h-10 text-sm bg-background/40 border-border/20 rounded-xl focus:border-primary/50 focus:bg-background/60 focus:ring-1 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/25"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] ml-0.5">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  className="h-10 text-sm bg-background/40 border-border/20 rounded-xl focus:border-primary/50 focus:bg-background/60 focus:ring-1 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/25"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] ml-0.5">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={72}
                    className="h-10 text-sm pr-10 bg-background/40 border-border/20 rounded-xl focus:border-primary/50 focus:bg-background/60 focus:ring-1 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/25"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 font-mono font-semibold text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 mt-1" 
                disabled={loading}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : isSignUp ? "Criar conta" : "Entrar"}
              </Button>
            </form>

            <div className="px-5 py-3 border-t border-border/15 bg-background/15">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-[11px] text-muted-foreground/50 hover:text-primary font-mono transition-colors duration-200"
              >
                {isSignUp ? "Já tem conta? " : "Não tem conta? "}
                <span className="text-primary/70 font-semibold">
                  {isSignUp ? "Entrar →" : "Criar uma →"}
                </span>
              </button>
            </div>
          </Card>
        </motion.div>

        <motion.p 
          className="text-[9px] text-muted-foreground/20 text-center mt-6 font-mono tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          Feito com 💜 para você
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Auth;
