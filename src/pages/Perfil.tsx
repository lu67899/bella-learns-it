import { useState } from "react";
import { Layout } from "@/components/Layout";
import { PageContainer } from "@/components/PageContainer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Camera, Mail, Award, Maximize, Minimize, User } from "lucide-react";
import { usePageSize, type PageSize } from "@/hooks/usePageSize";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Perfil() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { pageSize, setPageSize } = usePageSize();
  const [uploading, setUploading] = useState(false);

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

  return (
    <Layout>
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-2xl font-mono font-bold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Meu Perfil
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6 max-w-2xl"
        >
          {/* Avatar Section */}
          <motion.div variants={item}>
            <Card className="p-6 bg-card border-border">
              <div className="flex items-center gap-5">
                <div className="relative group">
                  <Avatar className="h-20 w-20 border-2 border-primary/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-mono">
                      {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                  >
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

          {/* Certificates */}
          <motion.div variants={item}>
            <Card className="p-6 bg-card border-border">
              <Label className="text-sm font-mono text-foreground mb-3 block">
                Certificados conquistados
              </Label>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Award className="h-10 w-10 text-primary/40" />
                <p className="text-sm">
                  Nenhum certificado conquistado ainda. Complete cursos para ganhar certificados!
                </p>
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
      </PageContainer>
    </Layout>
  );
}
