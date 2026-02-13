import {
  LayoutDashboard,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  StickyNote,
  Shield,
  LogOut,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Resumos", url: "/resumos", icon: BookOpen },
  { title: "Flashcards", url: "/flashcards", icon: BrainCircuit },
  { title: "Cronograma", url: "/cronograma", icon: CalendarDays },
  { title: "Anotações", url: "/anotacoes", icon: StickyNote },
  { title: "Admin", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-4">
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 pb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 glow-purple">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-mono text-base font-bold text-gradient">Bella Estuda</h1>
              <p className="text-[10px] text-muted-foreground">Sua plataforma de estudos</p>
            </div>
          )}
        </div>

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
      <div className="mt-auto border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-mono">
              {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono truncate">{profile?.display_name || "Usuário"}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </Sidebar>
  );
}
