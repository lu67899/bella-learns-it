import {
  BrainCircuit,
  CalendarDays,
  StickyNote,
  Shield,
  Newspaper,
  User,
  LogOut,
  Moon,
  Sparkles,
  Wand2,
  Coins,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const items = [
  { title: "Notícias", url: "/noticias", icon: Newspaper },
  { title: "Cronograma", url: "/cronograma", icon: CalendarDays },
  { title: "Anotações", url: "/anotacoes", icon: StickyNote },
  { title: "Admin", url: "/admin", icon: Shield },
];

const themeConfig = {
  dark: { icon: Sparkles, label: "Rosa" },
  pink: { icon: Wand2, label: "Hogwarts" },
  hogwarts: { icon: Moon, label: "Escuro" },
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { icon: ThemeIcon, label: themeLabel } = themeConfig[theme];

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-4">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 px-4 pb-4 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 glow-purple">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-mono text-base font-bold text-gradient">Bella Space</h1>
              <p className="text-[10px] text-muted-foreground">Sua plataforma de estudos</p>
            </div>
          )}
        </NavLink>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-[10px] uppercase tracking-widest">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
                      activeClassName="bg-primary/15 text-primary border-glow glow-purple"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <div className="mt-auto border-t border-border p-3 space-y-2">
        {/* Profile link */}
        <button
          onClick={() => navigate("/perfil")}
          className="flex items-center gap-2.5 w-full rounded-lg px-1.5 py-2 hover:bg-secondary/60 transition-colors"
        >
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-mono font-bold">
              {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-mono font-semibold text-foreground truncate">
                {profile?.display_name || "Usuário"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Coins className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {profile?.coins ?? 0}
                </span>
              </div>
            </div>
          )}
        </button>

        {/* Actions row */}
        {!collapsed && (
          <div className="flex items-center gap-1 px-1">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors flex-1"
              title={themeLabel}
            >
              <ThemeIcon className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono">{themeLabel}</span>
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono">Sair</span>
            </button>
          </div>
        )}

        {/* Collapsed actions */}
        {collapsed && (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
              title={themeLabel}
            >
              <ThemeIcon className="h-4 w-4" />
            </button>
            <button
              onClick={signOut}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </Sidebar>
  );
}
