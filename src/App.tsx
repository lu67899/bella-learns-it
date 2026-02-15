import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppFeaturesProvider } from "@/contexts/AppFeaturesContext";
import Index from "./pages/Index";
import Resumos from "./pages/Resumos";
import ResumoDetalhe from "./pages/ResumoDetalhe";
import Flashcards from "./pages/Flashcards";
import Cronograma from "./pages/Cronograma";
import Anotacoes from "./pages/Anotacoes";
import Admin from "./pages/Admin";
import ModuloPage from "./pages/Modulo";
import CursoPage from "./pages/Curso";
import Progresso from "./pages/Progresso";
import Desafios from "./pages/Desafios";
import Mix from "./pages/Mix";
import Noticias from "./pages/Noticias";
import Perfil from "./pages/Perfil";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground text-sm">Carregando...</p></div>;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/resumos" element={<ProtectedRoute><Resumos /></ProtectedRoute>} />
    <Route path="/resumos/:id" element={<ProtectedRoute><ResumoDetalhe /></ProtectedRoute>} />
    <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
    <Route path="/cronograma" element={<ProtectedRoute><Cronograma /></ProtectedRoute>} />
    <Route path="/anotacoes" element={<ProtectedRoute><Anotacoes /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
    <Route path="/curso/:id" element={<ProtectedRoute><CursoPage /></ProtectedRoute>} />
    <Route path="/modulo/:id" element={<ProtectedRoute><ModuloPage /></ProtectedRoute>} />
    <Route path="/progresso" element={<ProtectedRoute><Progresso /></ProtectedRoute>} />
    <Route path="/desafios" element={<ProtectedRoute><Desafios /></ProtectedRoute>} />
    <Route path="/mix" element={<ProtectedRoute><Mix /></ProtectedRoute>} />
    <Route path="/noticias" element={<ProtectedRoute><Noticias /></ProtectedRoute>} />
    <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppFeaturesProvider>
            <AppRoutes />
          </AppFeaturesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
