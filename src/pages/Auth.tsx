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

  useEffect(() => {
    supabase
      .from("admin_config")
      .select("logo_url")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-primary/8 rounded-full blur-[80px]" />
      </div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[380px] relative z-10"
      >
        {/* Logo */}
        <motion.div 
          className="flex flex-col items-center gap-4 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          <div className="relative">
            {logoUrl ? (
              <div className="h-20 w-20 rounded-2xl overflow-hidden border border-border/30 shadow-xl shadow-primary/10 bg-card/50 backdrop-blur-sm flex items-center justify-center">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 border border-primary/15 shadow-xl shadow-primary/10 flex items-center justify-center backdrop-blur-sm">
                <BrainCircuit className="h-10 w-10 text-primary" />
              </div>
            )}
            <motion.div
              className="absolute -top-1.5 -right-1.5"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <div className="h-6 w-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-accent" />
              </div>
            </motion.div>
          </div>

          <div className="text-center space-y-1">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">
              Bella Space
            </h1>
            <p className="text-xs text-muted-foreground/70 font-mono tracking-wide">
              Plataforma de estudos
            </p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="p-7 bg-card/60 backdrop-blur-xl border-border/40 shadow-2xl shadow-black/20 relative overflow-hidden">
            {/* Card top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="mb-6">
              <h2 className="text-base font-mono font-semibold text-foreground">
                {isSignUp ? "Criar conta" : "Bem-vinda de volta"}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-1">
                {isSignUp ? "Comece sua jornada de estudos ✨" : "Continue de onde parou 💜"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-medium text-muted-foreground/80 uppercase tracking-wider ml-0.5">
                    Nome
                  </label>
                  <Input
                    placeholder="Como quer ser chamada?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={100}
                    className="h-10 text-sm bg-secondary/40 border-border/40 focus:border-primary/50 focus:bg-secondary/60 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-medium text-muted-foreground/80 uppercase tracking-wider ml-0.5">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  className="h-10 text-sm bg-secondary/40 border-border/40 focus:border-primary/50 focus:bg-secondary/60 transition-all placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-medium text-muted-foreground/80 uppercase tracking-wider ml-0.5">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={72}
                    className="h-10 text-sm pr-10 bg-secondary/40 border-border/40 focus:border-primary/50 focus:bg-secondary/60 transition-all placeholder:text-muted-foreground/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 font-mono font-medium text-sm shadow-lg shadow-primary/15 hover:shadow-primary/25 transition-all duration-300 mt-1" 
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

            <div className="mt-5 pt-4 border-t border-border/30">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-xs text-muted-foreground hover:text-primary font-mono transition-colors duration-200"
              >
                {isSignUp ? "Já tem conta? Entrar →" : "Não tem conta? Criar uma →"}
              </button>
            </div>
          </Card>
        </motion.div>

        <p className="text-[10px] text-muted-foreground/30 text-center mt-6 font-mono tracking-wide">
          Feito com 💜 para você estudar melhor
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
