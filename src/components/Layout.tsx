import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePageSize } from "@/hooks/usePageSize";
import { useSidebar } from "@/components/ui/sidebar";
import { ChevronsRight } from "lucide-react";
import { useLocation } from "react-router-dom";

function MobileTrigger() {
  const { toggleSidebar } = useSidebar();
  const location = useLocation();

  if (location.pathname !== "/") return null;

  return (
    <button
      onClick={toggleSidebar}
      className="fixed top-1/2 -translate-y-1/2 left-0 z-20 md:hidden flex items-center justify-center h-12 w-5 rounded-r-full bg-primary/10 backdrop-blur-md border border-l-0 border-border/40 text-primary/50 hover:text-primary hover:bg-primary/20 hover:w-7 transition-all duration-300 ease-out group"
      aria-label="Abrir menu"
    >
      <ChevronsRight className="h-4 w-4 animate-[slide-nudge_2.5s_ease-in-out_infinite] group-hover:translate-x-0.5 transition-transform duration-300" />
    </button>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { pageSize } = usePageSize();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <MobileTrigger />
          <div className={`py-4 md:py-5 lg:py-6 overflow-x-hidden ${pageSize === "large" ? "px-3 md:px-8 lg:px-12" : "px-5 md:px-6 lg:px-8"}`}>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
