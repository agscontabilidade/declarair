import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BillingGate } from "@/components/billing/BillingGate";
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
import Checkout from "./pages/Checkout";
import Upgrade from "./pages/Upgrade";
import Cadastro from "./pages/Cadastro";
import Onboarding from "./pages/Onboarding";
import MalhaFina from "./pages/MalhaFina";
import Drive from "./pages/Drive";
import Addons from "./pages/Addons";
import WhatsApp from "./pages/WhatsApp";
import ClienteLogin from "./pages/cliente/ClienteLogin";
import ConviteCliente from "./pages/cliente/ConviteCliente";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import ClienteFormulario from "./pages/cliente/ClienteFormulario";
import ClienteDocumentos from "./pages/cliente/ClienteDocumentos";
import ClientePerfil from "./pages/ClientePerfil";
import DeclaracaoDetalhe from "./pages/DeclaracaoDetalhe";
import ConviteColaborador from "./pages/ConviteColaborador";
import ConfiguracoesAPI from "./pages/ConfiguracoesAPI";
import CadastroCliente from "./pages/cliente/CadastroCliente";
import NotFound from "./pages/NotFound";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import PoliticaLGPD from "./pages/PoliticaLGPD";
import Unsubscribe from "./pages/Unsubscribe";

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
              <Route path="/onboarding" element={<ProtectedRoute allowedType="contador"><Onboarding /></ProtectedRoute>} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/redefinir-senha" element={<RedefinirSenha />} />
              <Route path="/cliente/login" element={<ClienteLogin />} />
              <Route path="/cliente/convite/:token" element={<ConviteCliente />} />
              <Route path="/termos-de-uso" element={<TermosDeUso />} />
              <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
              <Route path="/politica-lgpd" element={<PoliticaLGPD />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/convite-colaborador/:token" element={<ConviteColaborador />} />
              <Route path="/cadastro-cliente/:token" element={<CadastroCliente />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />

              {/* Contador routes - billing gated */}
              <Route path="/dashboard" element={<ProtectedRoute allowedType="contador"><BillingGate><Dashboard /></BillingGate></ProtectedRoute>} />
              <Route path="/clientes/:id" element={<ProtectedRoute allowedType="contador"><BillingGate><ClientePerfil /></BillingGate></ProtectedRoute>} />
              <Route path="/declaracoes/:id" element={<ProtectedRoute allowedType="contador"><BillingGate><DeclaracaoDetalhe /></BillingGate></ProtectedRoute>} />
              <Route path="/declaracoes" element={<ProtectedRoute allowedType="contador"><BillingGate><Declaracoes /></BillingGate></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute allowedType="contador"><BillingGate><Clientes /></BillingGate></ProtectedRoute>} />
              <Route path="/cobrancas" element={<ProtectedRoute allowedType="contador"><BillingGate><Cobrancas /></BillingGate></ProtectedRoute>} />
              <Route path="/mensagens" element={<ProtectedRoute allowedType="contador"><BillingGate><Mensagens /></BillingGate></ProtectedRoute>} />
              <Route path="/capa" element={<ProtectedRoute allowedType="contador"><BillingGate><Capa /></BillingGate></ProtectedRoute>} />
              <Route path="/malha-fina" element={<ProtectedRoute allowedType="contador"><BillingGate><MalhaFina /></BillingGate></ProtectedRoute>} />
              <Route path="/drive" element={<ProtectedRoute allowedType="contador"><BillingGate><Drive /></BillingGate></ProtectedRoute>} />
              <Route path="/addons" element={<ProtectedRoute allowedType="contador"><BillingGate><Addons /></BillingGate></ProtectedRoute>} />
              <Route path="/whatsapp" element={<ProtectedRoute allowedType="contador"><BillingGate><WhatsApp /></BillingGate></ProtectedRoute>} />

              {/* Contador routes - always accessible */}
              <Route path="/configuracoes" element={<ProtectedRoute allowedType="contador"><Configuracoes /></ProtectedRoute>} />
              <Route path="/meus-planos" element={<ProtectedRoute allowedType="contador"><Upgrade /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute allowedType="contador"><Checkout /></ProtectedRoute>} />
              <Route path="/upgrade" element={<ProtectedRoute allowedType="contador"><Upgrade /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute allowedType="contador"><Perfil /></ProtectedRoute>} />
              <Route path="/api-keys" element={<ProtectedRoute allowedType="contador"><ConfiguracoesAPI /></ProtectedRoute>} />

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
