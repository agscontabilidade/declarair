import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
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

import Configuracoes from "./pages/Configuracoes";
import Declaracoes from "./pages/Declaracoes";
// Capa removed
import Perfil from "./pages/Perfil";
import Planos from "./pages/Planos";
import Checkout from "./pages/Checkout";
import Upgrade from "./pages/Upgrade";
import Cadastro from "./pages/Cadastro";
import Onboarding from "./pages/Onboarding";
// MalhaFina removed
import Drive from "./pages/Drive";
import Addons from "./pages/Addons";
// WhatsApp page removed (moved to settings)
import ClienteLogin from "./pages/cliente/ClienteLogin";
import ConviteCliente from "./pages/cliente/ConviteCliente";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import ClienteFormulario from "./pages/cliente/ClienteFormulario";
import ClienteDocumentos from "./pages/cliente/ClienteDocumentos";
import ClientePerfil from "./pages/ClientePerfil";
import DeclaracaoDetalhe from "./pages/DeclaracaoDetalhe";
import ConviteColaborador from "./pages/ConviteColaborador";
import ConfiguracoesAPI from "./pages/ConfiguracoesAPI";
import Relatorios from "./pages/Relatorios";
import WebhooksPage from "./pages/Webhooks";
import CadastroCliente from "./pages/cliente/CadastroCliente";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEscritorios from "./pages/admin/AdminEscritorios";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminAssinaturas from "./pages/admin/AdminAssinaturas";
import AdminBugReports from "./pages/admin/AdminBugReports";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminWebhooks from "./pages/admin/AdminWebhooks";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import PoliticaLGPD from "./pages/PoliticaLGPD";
import Unsubscribe from "./pages/Unsubscribe";
import SobreNos from "./pages/SobreNos";
import LandingV2 from "./pages/LandingV2";

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

  if (!session) return <LandingV2 />;
  if (userType === 'admin') return <Navigate to="/admin" replace />;
  if (userType === 'contador') return <Navigate to="/dashboard" replace />;
  if (userType === 'cliente') return <Navigate to="/cliente/dashboard" replace />;
  return <LandingV2 />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ThemeProvider>
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
              <Route path="/sobre" element={<SobreNos />} />
              <Route path="/landing-v2" element={<LandingV2 />} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute allowedType="admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/escritorios" element={<ProtectedRoute allowedType="admin"><AdminEscritorios /></ProtectedRoute>} />
              <Route path="/admin/usuarios" element={<ProtectedRoute allowedType="admin"><AdminUsuarios /></ProtectedRoute>} />
              <Route path="/admin/assinaturas" element={<ProtectedRoute allowedType="admin"><AdminAssinaturas /></ProtectedRoute>} />
              <Route path="/admin/bugs" element={<ProtectedRoute allowedType="admin"><AdminBugReports /></ProtectedRoute>} />
              <Route path="/admin/logs" element={<ProtectedRoute allowedType="admin"><AdminLogs /></ProtectedRoute>} />
              <Route path="/admin/emails" element={<ProtectedRoute allowedType="admin"><AdminEmails /></ProtectedRoute>} />

              {/* Contador routes - billing gated */}
              <Route path="/dashboard" element={<ProtectedRoute allowedType="contador"><BillingGate><Dashboard /></BillingGate></ProtectedRoute>} />
              <Route path="/clientes/:id" element={<ProtectedRoute allowedType="contador"><BillingGate><ClientePerfil /></BillingGate></ProtectedRoute>} />
              <Route path="/declaracoes/:id" element={<ProtectedRoute allowedType="contador"><BillingGate><DeclaracaoDetalhe /></BillingGate></ProtectedRoute>} />
              <Route path="/declaracoes" element={<ProtectedRoute allowedType="contador"><BillingGate><Declaracoes /></BillingGate></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute allowedType="contador"><BillingGate><Clientes /></BillingGate></ProtectedRoute>} />
              <Route path="/cobrancas" element={<ProtectedRoute allowedType="contador"><BillingGate><Cobrancas /></BillingGate></ProtectedRoute>} />
              <Route path="/mensagens" element={<Navigate to="/configuracoes?tab=mensagens" replace />} />
              {/* Capa removed */}
              {/* MalhaFina route removed */}
              <Route path="/drive" element={<ProtectedRoute allowedType="contador"><BillingGate><Drive /></BillingGate></ProtectedRoute>} />
              <Route path="/addons" element={<ProtectedRoute allowedType="contador"><BillingGate><Addons /></BillingGate></ProtectedRoute>} />
              <Route path="/whatsapp" element={<Navigate to="/configuracoes?tab=mensagens" replace />} />
              <Route path="/relatorios" element={<ProtectedRoute allowedType="contador"><BillingGate><Relatorios /></BillingGate></ProtectedRoute>} />
              <Route path="/webhooks" element={<ProtectedRoute allowedType="contador"><BillingGate><WebhooksPage /></BillingGate></ProtectedRoute>} />

              {/* Contador routes - always accessible */}
              <Route path="/configuracoes" element={<ProtectedRoute allowedType="contador"><Configuracoes /></ProtectedRoute>} />
              <Route path="/meus-planos" element={<ProtectedRoute allowedType="contador"><Upgrade /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute allowedType="contador"><Checkout /></ProtectedRoute>} />
              <Route path="/upgrade" element={<Navigate to="/meus-planos" replace />} />
              <Route path="/perfil" element={<ProtectedRoute allowedType="contador"><Perfil /></ProtectedRoute>} />
              <Route path="/api-keys" element={<ProtectedRoute allowedType="contador"><ConfiguracoesAPI /></ProtectedRoute>} />

              {/* Cliente routes */}
              <Route path="/cliente/dashboard" element={<ProtectedRoute allowedType="cliente"><ClienteDashboard /></ProtectedRoute>} />
              <Route path="/cliente/formulario" element={<ProtectedRoute allowedType="cliente"><ClienteFormulario /></ProtectedRoute>} />
              <Route path="/cliente/documentos" element={<ProtectedRoute allowedType="cliente"><ClienteDocumentos /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
