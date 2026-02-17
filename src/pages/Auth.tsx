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
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-neon-purple/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[400px] bg-neon-cyan/6 rounded-full blur-[130px]" />
        <div className="absolute top-[40%] right-[-5%] w-[350px] h-[350px] bg-neon-pink/5 rounded-full blur-[100px]" />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)`,
        backgroundSize: '24px 24px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo & Branding */}
        <motion.div 
          className="flex flex-col items-center gap-5 mb-10"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <div className="relative">
            {logoUrl ? (
              <div className="h-[72px] w-[72px] rounded-2xl overflow-hidden ring-1 ring-primary/20 shadow-2xl shadow-neon-purple/20 bg-card/80 backdrop-blur-md flex items-center justify-center">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-[72px] w-[72px] rounded-2xl bg-gradient-to-br from-neon-purple/25 via-primary/15 to-neon-cyan/15 ring-1 ring-primary/20 shadow-2xl shadow-neon-purple/20 flex items-center justify-center backdrop-blur-md">
                <BrainCircuit className="h-9 w-9 text-primary" />
              </div>
            )}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="h-5 w-5 rounded-full bg-neon-cyan/20 ring-1 ring-neon-cyan/30 flex items-center justify-center">
                <Sparkles className="h-2.5 w-2.5 text-neon-cyan" />
              </div>
            </motion.div>
          </div>

          <div className="text-center space-y-1.5">
            <h1 className="font-mono text-[22px] font-bold tracking-tight text-foreground">
              Bella Space
            </h1>
            <p className="text-[11px] text-muted-foreground/60 font-mono tracking-widest uppercase">
              Plataforma de estudos
            </p>
          </div>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          <Card className="p-0 bg-card/50 backdrop-blur-2xl border-border/30 shadow-2xl shadow-black/30 relative overflow-hidden rounded-2xl">
            {/* Top accent gradient */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-neon-purple/0 via-neon-purple/60 to-neon-cyan/0" />
            
            {/* Inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[80px] bg-neon-purple/5 blur-[60px] pointer-events-none" />

            <div className="p-7 pt-8">
              <div className="mb-7">
                <h2 className="text-lg font-mono font-bold text-foreground tracking-tight">
                  {isSignUp ? "Criar conta" : "Bem-vinda de volta"}
                </h2>
                <p className="text-xs text-muted-foreground/60 mt-1.5 font-mono">
                  {isSignUp ? "Comece sua jornada de estudos ✨" : "Continue de onde parou 💜"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-semibold text-muted-foreground/70 uppercase tracking-[0.15em] ml-0.5">
                      Nome
                    </label>
                    <Input
                      placeholder="Como quer ser chamada?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={100}
                      className="h-11 text-sm bg-background/50 border-border/30 rounded-xl focus:border-primary/60 focus:bg-background/70 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-semibold text-muted-foreground/70 uppercase tracking-[0.15em] ml-0.5">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    className="h-11 text-sm bg-background/50 border-border/30 rounded-xl focus:border-primary/60 focus:bg-background/70 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-semibold text-muted-foreground/70 uppercase tracking-[0.15em] ml-0.5">
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      maxLength={72}
                      className="h-11 text-sm pr-11 bg-background/50 border-border/30 rounded-xl focus:border-primary/60 focus:bg-background/70 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground/80 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 font-mono font-semibold text-sm rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 mt-2 bg-gradient-to-r from-primary to-neon-purple" 
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
            </div>

            <div className="px-7 py-4 border-t border-border/20 bg-background/20">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="w-full text-xs text-muted-foreground/60 hover:text-primary font-mono transition-colors duration-200 tracking-wide"
              >
                {isSignUp ? "Já tem conta? " : "Não tem conta? "}
                <span className="text-primary/80 font-semibold">
                  {isSignUp ? "Entrar →" : "Criar uma →"}
                </span>
              </button>
            </div>
          </Card>
        </motion.div>

        <motion.p 
          className="text-[10px] text-muted-foreground/25 text-center mt-8 font-mono tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Feito com 💜 para você
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Auth;
