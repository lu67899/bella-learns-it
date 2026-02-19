import { useState, useEffect } from "react";
import {
  BrainCircuit,
  CalendarDays,
  StickyNote,
  Shield,
  Newspaper,
  Headphones,
  Play,
  BookOpen,
  LogOut,
  Moon,
  Sparkles,
  Wand2,
  CloudSun,
  Gem,
  Coins,
  ChevronRight,
  X,
  Gamepad2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";

const items = [
  { title: "Notícias", url: "/noticias", icon: Newspaper },
  { title: "Play", url: "/play", icon: Play },
  { title: "Cronograma", url: "/cronograma", icon: CalendarDays },
  { title: "Anotações", url: "/anotacoes", icon: StickyNote },
  { title: "Audiobooks", url: "/audiobooks", icon: Headphones },
  { title: "Livros PDF", url: "/livros-pdf", icon: BookOpen },
  { title: "Jogos", url: "/jogos", icon: Gamepad2 },
  { title: "Admin", url: "/admin", icon: Shield },
];

const themeConfig = {
  dark: { icon: Sparkles, label: "Rosa" },
  pink: { icon: Wand2, label: "Hogwarts" },
  hogwarts: { icon: CloudSun, label: "Azul Céu" },
  sky: { icon: Gem, label: "Roxo" },
  purple: { icon: Moon, label: "Escuro" },
};

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, signOut } = useAuth();
  const { stopPlayback } = useAudioPlayer();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { icon: ThemeIcon, label: themeLabel } = themeConfig[theme];
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

  const handleNav = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col h-full bg-sidebar">
        {/* Header - Logo + Title */}
        <div className="px-5 pt-14 sm:pt-6 pb-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNav("/")}
              className="flex items-center gap-3"
            >
              {logoUrl ? (
                <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden ring-1 ring-primary/20">
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
              )}
              {!collapsed && (
                <div>
                  <h1 className="font-mono text-base font-bold text-foreground">
                    {nomeApp}
                  </h1>
                  <p className="text-[10px] text-muted-foreground/50 font-mono">
                    {subtituloApp}
                  </p>
                </div>
              )}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
                title={themeLabel}
              >
                <ThemeIcon className="h-3.5 w-3.5" />
              </button>
              {isMobile && (
                <button
                  onClick={() => setOpenMobile(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-5 h-px bg-border/30 mb-2" />

        {/* Navigation */}
        <SidebarGroup className="px-3">
          {!collapsed && (
            <p className="px-3 pb-3 text-[10px] font-mono font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">
              Menu
            </p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <button
                        onClick={() => handleNav(item.url)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 w-full ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.15)]"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-primary" : ""}`} />
                        {!collapsed && <span className="font-mono">{item.title}</span>}
                        {isActive && !collapsed && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer - User + Actions */}
        <div className="mt-auto px-5 pb-8 pt-4 space-y-3">
          <div className="h-px bg-border/30" />

          {/* User row */}
          <button
            onClick={() => handleNav("/perfil")}
            className={`flex items-center gap-3 w-full rounded-xl hover:bg-muted/40 transition-colors ${
              collapsed ? "justify-center p-2" : "px-3 py-2.5"
            }`}
          >
            <Avatar className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} className="rounded-lg" />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono font-bold rounded-lg">
                {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-foreground truncate">
                  {profile?.display_name || "Usuário"}
                </p>
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  {profile?.coins ?? 0} moedas
                </span>
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className={`flex items-center gap-2 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ${
              collapsed ? "justify-center p-2" : "px-3 py-2"
            }`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span className="text-[11px] font-mono">Sair</span>}
          </button>
        </div>
      </SidebarContent>

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="max-w-[280px] rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/5 p-0 overflow-hidden">
          <div className="flex flex-col items-center text-center px-6 pt-6 pb-4">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center mb-3 ring-1 ring-destructive/20">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            <AlertDialogHeader className="space-y-1">
              <AlertDialogTitle className="text-sm font-bold tracking-tight">
                Deseja sair?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground/70 leading-relaxed">
                Seu progresso está salvo.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="flex-row gap-2 border-t border-border/30 bg-muted/20 px-4 py-3 sm:space-x-0">
            <AlertDialogCancel className="flex-1 m-0 h-8 text-xs rounded-lg border-border/50 bg-transparent hover:bg-muted/50 font-medium">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                stopPlayback();
                signOut();
              }}
              className="flex-1 m-0 h-8 text-xs rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium shadow-lg shadow-destructive/20"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
