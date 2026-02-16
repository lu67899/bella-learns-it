import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { usePageSize } from "@/hooks/usePageSize";

export function Layout({ children }: { children: React.ReactNode }) {
  const { pageSize } = usePageSize();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className={`px-5 py-4 md:px-6 md:py-5 lg:py-6 ${pageSize === "large" ? "lg:px-12" : "lg:px-8"}`}>
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
