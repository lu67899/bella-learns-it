import { useState } from "react";
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
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <motion.div 
          className="flex flex-col items-center gap-3 mb-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/20 shadow-lg shadow-primary/10">
              <BrainCircuit className="h-9 w-9 text-primary" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="h-4 w-4 text-accent" />
            </motion.div>
          </div>
          <div className="text-center">
            <h1 className="font-mono text-2xl font-bold text-gradient tracking-tight">Bella Space</h1>
            <p className="text-xs text-muted-foreground mt-1">Sua plataforma de estudos ✨</p>
          </div>
        </motion.div>

        <Card className="p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl shadow-primary/5">
          <h2 className="text-lg font-mono font-semibold text-center mb-1 text-foreground">
            {isSignUp ? "Criar conta" : "Bem-vinda de volta"}
          </h2>
          <p className="text-xs text-muted-foreground text-center mb-6">
            {isSignUp ? "Comece sua jornada de estudos" : "Continue de onde parou"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground ml-1">Nome</label>
                <Input
                  placeholder="Como quer ser chamada?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={100}
                  className="h-11 text-sm bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground ml-1">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="h-11 text-sm bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground ml-1">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={72}
                  className="h-11 text-sm pr-10 bg-secondary/50 border-border/50 focus:border-primary/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow" 
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

          <div className="mt-6 text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">ou</span>
              </div>
            </div>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-primary/80 hover:text-primary font-medium transition-colors"
            >
              {isSignUp ? "Já tem conta? Entrar" : "Não tem conta? Criar uma"}
            </button>
          </div>
        </Card>

        <p className="text-[10px] text-muted-foreground/50 text-center mt-6">
          Feito com 💜 para você estudar melhor
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
