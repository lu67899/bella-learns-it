import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePageSize } from "@/hooks/usePageSize";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Moon, Sparkles, Wand2, Coins, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const themeConfig = {
  dark: { icon: Sparkles, label: "Tema Rosa" },
  pink: { icon: Wand2, label: "Tema Hogwarts" },
  hogwarts: { icon: Moon, label: "Tema Escuro" },
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { pageSize } = usePageSize();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { icon: ThemeIcon, label: themeLabel } = themeConfig[theme];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4">
            <SidebarTrigger />
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none focus:outline-none">
                <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-secondary/60 transition-colors cursor-pointer">
                  <Avatar className="h-7 w-7 ring-2 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/15 text-primary text-[11px] font-mono font-bold">
                      {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                    {profile?.display_name || "Usuário"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-1.5">
                <div className="px-2 py-2 mb-1">
                  <p className="text-sm font-mono font-semibold text-foreground truncate">
                    {profile?.display_name || "Usuário"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Coins className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-mono text-muted-foreground">
                      {profile?.coins ?? 0} moedas
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/perfil")} className="cursor-pointer gap-2 rounded-md">
                  <User className="h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer gap-2 rounded-md">
                  <ThemeIcon className="h-4 w-4" />
                  {themeLabel}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer gap-2 rounded-md text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <div className={`px-5 py-4 md:px-6 md:py-5 lg:py-6 ${pageSize === "large" ? "lg:px-12" : "lg:px-8"}`}>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
