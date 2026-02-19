import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { PageContainer } from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Camera, Mail, Award, Maximize, Minimize, User, Coins, Settings, Loader2, CheckCircle2, Clock, Download, Banknote, Send } from "lucide-react";
import BackButton from "@/components/BackButton";
import { usePageSize } from "@/hooks/usePageSize";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function Perfil() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { pageSize, setPageSize } = usePageSize();
  const [uploading, setUploading] = useState(false);
  const [certConfig, setCertConfig] = useState<{ creditos_minimos: number } | null>(null);
  const [certificados, setCertificados] = useState<{ id: string; status: string; certificado_url: string | null; created_at: string }[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [viewingCert, setViewingCert] = useState<string | null>(null);
  const [chavePix, setChavePix] = useState("");
  const [resgates, setResgates] = useState<{ id: string; status: string; valor_moedas: number; chave_pix: string; created_at: string }[]>([]);
  const [requestingResgate, setRequestingResgate] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: config } = await supabase.from("certificado_config").select("creditos_minimos").eq("id", 1).single();
      if (config) setCertConfig(config);

      if (user) {
        const { data: sols } = await supabase
          .from("certificado_solicitacoes")
          .select("id, status, certificado_url, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (sols) setCertificados(sols);

        const { data: resgateData } = await supabase
          .from("resgate_solicitacoes")
          .select("id, status, valor_moedas, chave_pix, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (resgateData) setResgates(resgateData);
      }
    };
    loadData();
  }, [user]);

  const requestResgate = async () => {
    if (!user || !chavePix.trim()) return;
    setRequestingResgate(true);
    const { error } = await supabase.from("resgate_solicitacoes").insert({
      user_id: user.id,
      chave_pix: chavePix.trim(),
      valor_moedas: minCoins,
    });
    if (error) {
      toast.error("Erro ao solicitar resgate");
    } else {
      // Deduct coins
      const newCoins = Math.max(coins - minCoins, 0);
      await supabase.from("profiles").update({ coins: newCoins }).eq("user_id", user.id);
      await refreshProfile();
      toast.success("Resgate solicitado! O administrador será notificado.");
      setChavePix("");
      const { data: resgateData } = await supabase
        .from("resgate_solicitacoes")
        .select("id, status, valor_moedas, chave_pix, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (resgateData) setResgates(resgateData);
    }
    setRequestingResgate(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/profile-avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast.success("Foto atualizada com sucesso!");
      await refreshProfile();
    } catch (err: any) {
      toast.error("Erro ao enviar foto: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  const coins = profile?.coins ?? 0;
  const minCoins = certConfig?.creditos_minimos ?? 100;
  const enviados = certificados.filter((c) => c.status === "enviado" && c.certificado_url);
  const hasPendingResgate = resgates.some((r) => r.status === "pendente");
  const canRequestResgate = coins >= minCoins && !hasPendingResgate;
  const progressPercent = Math.min((coins / minCoins) * 100, 100);

  return (
    <Layout>
      <PageContainer>
        <div className="mb-5">
          <BackButton to="/" />
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-mono font-bold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Meu Perfil
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
        </div>

        <Tabs defaultValue="perfil" className="max-w-2xl">
          <TabsList className="mb-6">
            <TabsTrigger value="perfil" className="gap-1.5">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-1.5">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="perfil">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Avatar Section */}
              <motion.div variants={item}>
                <Card className="p-6 bg-card border-border">
                  <div className="flex items-center gap-5">
                    <div className="relative group">
                      <Avatar className="h-20 w-20 rounded-2xl border-2 border-primary/30">
                        <AvatarImage src={profile?.avatar_url || undefined} className="rounded-2xl" />
                        <AvatarFallback className="bg-primary/20 text-primary text-2xl font-mono rounded-2xl">
                          {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Camera className="h-5 w-5 text-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    <div>
                      <h2 className="text-lg font-mono font-bold text-foreground">
                        {profile?.display_name || "Usuário"}
                      </h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Mail className="h-3.5 w-3.5" />
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    disabled={uploading}
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                  >
                    <Camera className="h-4 w-4 mr-1.5" />
                    {uploading ? "Enviando..." : "Alterar foto"}
                  </Button>
                </Card>
              </motion.div>

              {/* Coins */}
              <motion.div variants={item}>
                <Card className="p-6 bg-card border-border">
                  <Label className="text-sm font-mono text-foreground mb-3 block">
                    Minhas Moedas
                  </Label>
                  <div className="flex items-center gap-3">
                    <Coins className="h-10 w-10 text-primary" />
                    <div>
                      <p className="text-2xl font-mono font-bold text-foreground">
                        {coins}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ganhe moedas ao concluir tópicos, acertar desafios e assistir vídeos!
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Certificate Gallery */}
              {enviados.length > 0 && (
                <motion.div variants={item}>
                  <Card className="p-6 bg-card border-border">
                    <Label className="text-sm font-mono text-foreground mb-3 block">
                      Certificados
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">{enviados.length} certificado{enviados.length > 1 ? "s" : ""} disponíve{enviados.length > 1 ? "is" : "l"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {enviados.map((cert) => (
                          <div key={cert.id} className="group relative rounded-lg border border-border overflow-hidden cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setViewingCert(cert.certificado_url)}>
                            <img src={cert.certificado_url!} alt="Certificado" className="w-full aspect-[4/3] object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Maximize className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                              <p className="text-[9px] text-white/80 font-mono">{new Date(cert.created_at).toLocaleDateString("pt-BR")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Resgate de Valor */}
              <motion.div variants={item}>
                <Card className="p-6 bg-card border-border">
                  <Label className="text-sm font-mono text-foreground mb-3 block flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-primary" />
                    Resgatar Valor
                  </Label>

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{coins} / {minCoins} moedas</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  {/* Pending resgate */}
                  {hasPendingResgate && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-10 w-10 text-primary/40 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Resgate solicitado!</p>
                        <p className="text-xs">Aguardando o administrador processar seu resgate.</p>
                      </div>
                    </div>
                  )}

                  {/* Request resgate */}
                  {!hasPendingResgate && (
                    <>
                      {canRequestResgate ? (
                        <form role="presentation" autoComplete="off" onSubmit={(e) => { e.preventDefault(); requestResgate(); }} className="space-y-3">
                          <p className="text-sm text-primary font-medium">🎉 Você pode resgatar {minCoins} moedas!</p>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Chave PIX</label>
                            <Input
                              placeholder="CPF, email, telefone ou chave aleatória"
                              value={chavePix}
                              onChange={(e) => setChavePix(e.target.value)}
                              maxLength={100}
                            />
                          </div>
                          <Button type="submit" disabled={requestingResgate || !chavePix.trim()} className="gap-1.5">
                            {requestingResgate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Solicitar Resgate
                          </Button>
                        </form>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Alcance {minCoins} moedas para solicitar um resgate. Continue estudando!
                        </p>
                      )}
                    </>
                  )}

                  {/* History */}
                  {resgates.length > 0 && (
                    <div className="mt-4 border-t border-border pt-4">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Histórico</p>
                      <div className="space-y-2">
                        {resgates.map((r) => (
                          <div key={r.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")} • {r.valor_moedas} moedas</span>
                            <span className={r.status === "pago" ? "text-primary font-medium" : "text-muted-foreground"}>
                              {r.status === "pago" ? "✓ Pago" : "Pendente"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Lightbox - rendered outside TabsContent to avoid layout issues */}
          {viewingCert && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setViewingCert(null)}
            >
              <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10" onClick={() => setViewingCert(null)}>
                <Minimize className="h-6 w-6" />
              </button>
              <img
                src={viewingCert}
                alt="Certificado"
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <a
                href={viewingCert}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-6 left-1/2 -translate-x-1/2"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Download className="h-4 w-4" /> Baixar
                </Button>
              </a>
            </div>
          )}

          <TabsContent value="config">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Page Size Setting */}
              <motion.div variants={item}>
                <Card className="p-6 bg-card border-border">
                  <Label className="text-sm font-mono text-foreground mb-3 block">
                    Tamanho da página
                  </Label>
                  <p className="text-xs text-muted-foreground mb-4">
                    Escolha o tamanho padrão das páginas do sistema.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant={pageSize === "default" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPageSize("default")}
                      className="gap-1.5"
                    >
                      <Minimize className="h-4 w-4" />
                      Padrão
                    </Button>
                    <Button
                      variant={pageSize === "large" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPageSize("large")}
                      className="gap-1.5"
                    >
                      <Maximize className="h-4 w-4" />
                      Grande
                    </Button>
                  </div>
                </Card>
              </motion.div>

              {/* Email Info */}
              <motion.div variants={item}>
                <Card className="p-6 bg-card border-border">
                  <Label className="text-sm font-mono text-foreground mb-3 block">
                    Informações da conta
                  </Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span className="text-foreground font-mono">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome</span>
                      <span className="text-foreground font-mono">{profile?.display_name}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </Layout>
  );
}
