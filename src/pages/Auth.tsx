import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [cidade, setCidade] = useState("");
  const [idade, setIdade] = useState("");
  const [codigo, setCodigo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [nomeApp, setNomeApp] = useState("Bella Space");
  const [subtituloApp, setSubtituloApp] = useState("Plataforma de estudos");
  const [codigoAutorizacao, setCodigoAutorizacao] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("admin_config")
      .select("logo_url, nome_app, subtitulo, codigo_autorizacao")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
        if ((data as any)?.nome_app) setNomeApp((data as any).nome_app);
        if ((data as any)?.subtitulo) setSubtituloApp((data as any).subtitulo);
        if ((data as any)?.codigo_autorizacao) setCodigoAutorizacao((data as any).codigo_autorizacao);
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

    // Validate authorization code on signup
    if (isSignUp && codigoAutorizacao) {
      if (codigo.trim() !== codigoAutorizacao) {
        toast.error("Código de autorização inválido");
        return;
      }
    }

    // Validate age
    if (isSignUp && idade) {
      const idadeNum = parseInt(idade);
      if (isNaN(idadeNum) || idadeNum < 1 || idadeNum > 120) {
        toast.error("Idade inválida");
        return;
      }
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

        // Update profile with city and age after creation
        const updates: Record<string, any> = {};
        if (cidade.trim()) updates.cidade = cidade.trim();
        if (idade) updates.idade = parseInt(idade);
        if (Object.keys(updates).length > 0) {
          // Small delay to let trigger create profile
          setTimeout(async () => {
            await supabase.from("profiles").update(updates).eq("user_id", userId);
          }, 1000);
        }

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="p-0 bg-card/60 backdrop-blur-2xl border-border/20 shadow-2xl shadow-black/40 overflow-hidden rounded-2xl">
            <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            {/* Logo + Title */}
            <div className="flex items-center gap-4 px-5 pt-6 pb-4">
              <div className="relative shrink-0">
                {logoUrl ? (
                  <div className="h-16 w-16 rounded-2xl overflow-hidden ring-1 ring-primary/25 shadow-lg shadow-primary/20">
                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 ring-1 ring-primary/25 shadow-lg shadow-primary/20 flex items-center justify-center">
                    <BrainCircuit className="h-8 w-8 text-primary" />
                  </div>
                )}
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="h-4 w-4 rounded-full bg-accent/20 ring-1 ring-accent/30 flex items-center justify-center">
                    <Sparkles className="h-2 w-2 text-accent" />
                  </div>
                </motion.div>
              </div>
              <div className="min-w-0">
                <h1 className="font-mono text-xl font-bold tracking-tight text-foreground leading-tight">
                  {nomeApp}
                </h1>
                <p className="text-[9px] text-muted-foreground/40 font-mono tracking-[0.2em] uppercase mt-0.5">
                  {subtituloApp}
                </p>
                <p className="text-xs text-muted-foreground/50 mt-1.5 font-mono">
                  {isSignUp ? "Comece sua jornada ✨" : "Continue de onde parou 💜"}
                </p>
              </div>
            </div>

            <div className="mx-5 h-px bg-border/20" />

            <form onSubmit={handleSubmit} className="px-5 pb-5 pt-3 space-y-3">
              {isSignUp && (
                <>
                  <FormField label="Nome" placeholder="Como quer ser chamada?" value={displayName} onChange={setDisplayName} maxLength={100} />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Cidade (opcional)" placeholder="Sua cidade" value={cidade} onChange={setCidade} maxLength={100} />
                    <FormField label="Idade (opcional)" placeholder="Ex: 25" value={idade} onChange={setIdade} maxLength={3} type="number" />
                  </div>

                  {codigoAutorizacao && (
                    <FormField label="Código de autorização" placeholder="Digite o código" value={codigo} onChange={setCodigo} maxLength={50} />
                  )}
                </>
              )}

              <FormField label="Email" placeholder="seu@email.com" value={email} onChange={setEmail} maxLength={255} type="email" />

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
                    autoComplete={isSignUp ? "new-password" : "current-password"}
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

function FormField({ label, placeholder, value, onChange, maxLength, type = "text" }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void; maxLength: number; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-mono font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] ml-0.5">
        {label}
      </label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="h-10 text-sm bg-background/40 border-border/20 rounded-xl focus:border-primary/50 focus:bg-background/60 focus:ring-1 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/25"
      />
    </div>
  );
}

export default Auth;
