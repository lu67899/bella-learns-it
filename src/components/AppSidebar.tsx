import {
  BrainCircuit,
  CalendarDays,
  StickyNote,
  Shield,
  Newspaper,
  Headphones,
  LogOut,
  Moon,
  Sparkles,
  Wand2,
  CloudSun,
  Gem,
  Coins,
  ChevronRight,
  X,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
import { useTheme } from "@/hooks/useTheme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";

const items = [
  { title: "Notícias", url: "/noticias", icon: Newspaper },
  { title: "Cronograma", url: "/cronograma", icon: CalendarDays },
  { title: "Anotações", url: "/anotacoes", icon: StickyNote },
  { title: "Audiobooks", url: "/audiobooks", icon: Headphones },
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
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { icon: ThemeIcon, label: themeLabel } = themeConfig[theme];

  const handleNav = (url: string) => {
    navigate(url);
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col h-full bg-sidebar">
        {/* Header */}
        <div className="px-5 pt-8 pb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNav("/")}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <BrainCircuit className="h-5 w-5 text-primary" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="font-mono text-base font-bold text-foreground">
                    Bella Space
                  </h1>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Plataforma de estudos
                  </p>
                </div>
              )}
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

        {/* User Card */}
        <div className="px-5 pb-6">
          <button
            onClick={() => handleNav("/perfil")}
            className="flex items-center gap-3 w-full p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-mono font-bold">
                {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.display_name || "Usuário"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Coins className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {profile?.coins ?? 0} moedas
                  </span>
                </div>
              </div>
            )}
            {!collapsed && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <SidebarGroup className="flex-1 px-3">
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

        {/* Footer Actions */}
        <div className="px-5 pb-8 pt-4 space-y-2">
          <div className="h-px bg-border/40 mb-4" />
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 w-full rounded-xl text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors ${
              collapsed ? "justify-center p-2" : "px-4 py-2.5"
            }`}
          >
            <ThemeIcon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-xs font-mono">{themeLabel}</span>}
          </button>
          <button
            onClick={signOut}
            className={`flex items-center gap-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors ${
              collapsed ? "justify-center p-2" : "px-4 py-2.5"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-xs font-mono">Sair</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
