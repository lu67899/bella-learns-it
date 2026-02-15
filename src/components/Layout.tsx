import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-3">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <div className="px-5 py-4 md:px-6 md:py-5 lg:px-8 lg:py-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
