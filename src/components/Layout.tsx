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
import { User, LogOut, Moon, Sparkles, Wand2 } from "lucide-react";
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
          <header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-3">
            <SidebarTrigger />
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-8 w-8 border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-mono">
                    {profile?.display_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/perfil")} className="cursor-pointer gap-2">
                  <User className="h-4 w-4" />
                  Meu Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer gap-2">
                  <ThemeIcon className="h-4 w-4" />
                  {themeLabel}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
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
