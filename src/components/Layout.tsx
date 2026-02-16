import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePageSize } from "@/hooks/usePageSize";
import { useSidebar } from "@/components/ui/sidebar";
import { ChevronsRight } from "lucide-react";

function MobileTrigger() {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="fixed top-1/2 -translate-y-1/2 left-1 z-20 md:hidden flex items-center justify-center h-10 w-6 rounded-r-lg bg-primary/10 backdrop-blur-md border border-l-0 border-border/50 text-primary/70 hover:text-primary hover:bg-primary/20 transition-all group"
      aria-label="Abrir menu"
    >
      <ChevronsRight className="h-4 w-4 animate-[pulse-glow_2s_ease-in-out_infinite] group-hover:scale-110 transition-transform" />
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
          <div className={`px-5 py-4 md:px-6 md:py-5 lg:py-6 ${pageSize === "large" ? "lg:px-12" : "lg:px-8"}`}>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
