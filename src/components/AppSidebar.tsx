import {
  BrainCircuit,
  CalendarDays,
  StickyNote,
  Shield,
  Newspaper,
  LogOut,
  Moon,
  Sparkles,
  Wand2,
  CloudSun,
  Gem,
  Coins,
  ChevronRight,
  User,
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
import { Separator } from "@/components/ui/separator";

const items = [
  { title: "Notícias", url: "/noticias", icon: Newspaper },
  { title: "Cronograma", url: "/cronograma", icon: CalendarDays },
  { title: "Anotações", url: "/anotacoes", icon: StickyNote },
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
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { icon: ThemeIcon, label: themeLabel } = themeConfig[theme];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-3 pt-5 pb-2">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-sidebar-accent/60 transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-mono text-sm font-bold text-sidebar-accent-foreground">
                  Bella Space
                </h1>
                <p className="text-[10px] text-sidebar-foreground/60">
                  Plataforma de estudos
                </p>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation */}
        <SidebarGroup className="flex-1 px-3 pt-2">
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-mono font-medium text-sidebar-foreground/40 uppercase tracking-[0.15em]">
              Navegação
            </p>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                          isActive
                            ? "bg-primary/12 text-primary font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                        activeClassName=""
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                        <span>{item.title}</span>
                        {isActive && !collapsed && (
                          <ChevronRight className="h-3.5 w-3.5 ml-auto text-primary/50" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-2">
          <Separator className="bg-sidebar-border/60" />

          {/* User profile */}
          <button
            onClick={() => navigate("/perfil")}
            className={`flex items-center w-full rounded-lg transition-colors hover:bg-sidebar-accent/60 ${
              collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5"
            }`}
          >
            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-sidebar-border">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-mono font-bold">
                {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-medium text-sidebar-accent-foreground truncate">
                  {profile?.display_name || "Usuário"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Coins className="h-3 w-3 text-primary/70" />
                  <span className="text-[10px] font-mono text-sidebar-foreground/60">
                    {profile?.coins ?? 0} moedas
                  </span>
                </div>
              </div>
            )}
          </button>

          {/* Action buttons */}
          <div className={`flex ${collapsed ? "flex-col items-center" : "items-center"} gap-1`}>
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors ${
                collapsed ? "p-2" : "px-3 py-1.5 flex-1"
              }`}
              title={themeLabel}
            >
              <ThemeIcon className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span className="text-[11px] font-mono">{themeLabel}</span>}
            </button>
            <button
              onClick={signOut}
              className={`flex items-center gap-2 rounded-lg text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors ${
                collapsed ? "p-2" : "px-3 py-1.5"
              }`}
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && <span className="text-[11px] font-mono">Sair</span>}
            </button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
