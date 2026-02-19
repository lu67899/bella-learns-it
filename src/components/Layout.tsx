import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePageSize } from "@/hooks/usePageSize";

export function Layout({ children }: { children: React.ReactNode }) {
  const { pageSize } = usePageSize();

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className={`py-4 md:py-5 lg:py-6 overflow-x-hidden ${pageSize === "large" ? "px-3 md:px-8 lg:px-12" : "px-5 md:px-6 lg:px-8"}`}>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
