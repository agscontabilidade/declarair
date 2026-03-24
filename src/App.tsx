import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import Index from "./pages/Index";
import Login from "./pages/Login";
import RecuperarSenha from "./pages/RecuperarSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Cobrancas from "./pages/Cobrancas";
import Mensagens from "./pages/Mensagens";
import Configuracoes from "./pages/Configuracoes";
import Declaracoes from "./pages/Declaracoes";
import Capa from "./pages/Capa";
import Perfil from "./pages/Perfil";
import Planos from "./pages/Planos";
import Cadastro from "./pages/Cadastro";
import Onboarding from "./pages/Onboarding";
import MalhaFina from "./pages/MalhaFina";
import Drive from "./pages/Drive";
import ClienteLogin from "./pages/cliente/ClienteLogin";
import ConviteCliente from "./pages/cliente/ConviteCliente";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import ClienteFormulario from "./pages/cliente/ClienteFormulario";
import ClienteDocumentos from "./pages/cliente/ClienteDocumentos";
import ClientePerfil from "./pages/ClientePerfil";
import DeclaracaoDetalhe from "./pages/DeclaracaoDetalhe";
import NotFound from "./pages/NotFound";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import PoliticaLGPD from "./pages/PoliticaLGPD";

const queryClient = new QueryClient();

function RootRedirect() {
  const { session, userType, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return <Index />;
  if (userType === 'contador') return <Navigate to="/dashboard" replace />;
  if (userType === 'cliente') return <Navigate to="/cliente/dashboard" replace />;
  return <Index />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
              <Route path="/cliente/login" element={<ClienteLogin />} />
              <Route path="/cliente/convite/:token" element={<ConviteCliente />} />
              <Route path="/termos-de-uso" element={<TermosDeUso />} />
              <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
              <Route path="/politica-lgpd" element={<PoliticaLGPD />} />

              {/* Contador routes */}
              <Route path="/dashboard" element={<ProtectedRoute allowedType="contador"><Dashboard /></ProtectedRoute>} />
              <Route path="/clientes/:id" element={<ProtectedRoute allowedType="contador"><ClientePerfil /></ProtectedRoute>} />
              <Route path="/declaracoes/:id" element={<ProtectedRoute allowedType="contador"><DeclaracaoDetalhe /></ProtectedRoute>} />
              <Route path="/declaracoes" element={<ProtectedRoute allowedType="contador"><Declaracoes /></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute allowedType="contador"><Clientes /></ProtectedRoute>} />
              <Route path="/cobrancas" element={<ProtectedRoute allowedType="contador"><Cobrancas /></ProtectedRoute>} />
              <Route path="/mensagens" element={<ProtectedRoute allowedType="contador"><Mensagens /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute allowedType="contador"><Configuracoes /></ProtectedRoute>} />
              <Route path="/planos" element={<ProtectedRoute allowedType="contador"><Planos /></ProtectedRoute>} />
              <Route path="/capa" element={<ProtectedRoute allowedType="contador"><Capa /></ProtectedRoute>} />
              <Route path="/malha-fina" element={<ProtectedRoute allowedType="contador"><MalhaFina /></ProtectedRoute>} />
              <Route path="/drive" element={<ProtectedRoute allowedType="contador"><Drive /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute allowedType="contador"><Perfil /></ProtectedRoute>} />

              {/* Cliente routes */}
              <Route path="/cliente/dashboard" element={<ProtectedRoute allowedType="cliente"><ClienteDashboard /></ProtectedRoute>} />
              <Route path="/cliente/formulario" element={<ProtectedRoute allowedType="cliente"><ClienteFormulario /></ProtectedRoute>} />
              <Route path="/cliente/documentos" element={<ProtectedRoute allowedType="cliente"><ClienteDocumentos /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
