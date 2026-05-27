import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BillingGate } from "@/components/billing/BillingGate";
import { useBillingStatus } from "@/hooks/useBillingStatus";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteLoadingBar } from "@/components/RouteLoadingBar";

// Eager: landing inicial (rota /) — evita Suspense fallback no primeiro paint público
import LandingV2 from "./pages/LandingV2";

// Lazy: todas as demais páginas
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Cobrancas = lazy(() => import("./pages/Cobrancas"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Declaracoes = lazy(() => import("./pages/Declaracoes"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Planos = lazy(() => import("./pages/Planos"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Upgrade = lazy(() => import("./pages/Upgrade"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Drive = lazy(() => import("./pages/Drive"));
const Addons = lazy(() => import("./pages/Addons"));
const ClienteLogin = lazy(() => import("./pages/cliente/ClienteLogin"));
const ConviteCliente = lazy(() => import("./pages/cliente/ConviteCliente"));
const ClienteDashboard = lazy(() => import("./pages/cliente/ClienteDashboard"));
const ClienteFormulario = lazy(() => import("./pages/cliente/ClienteFormulario"));
const ClienteDocumentos = lazy(() => import("./pages/cliente/ClienteDocumentos"));
const ClientePerfil = lazy(() => import("./pages/ClientePerfil"));
const DeclaracaoDetalhe = lazy(() => import("./pages/DeclaracaoDetalhe"));
const ConviteColaborador = lazy(() => import("./pages/ConviteColaborador"));
const ConfiguracoesAPI = lazy(() => import("./pages/ConfiguracoesAPI"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Lembretes = lazy(() => import("./pages/Lembretes"));
const WebhooksPage = lazy(() => import("./pages/Webhooks"));
const CadastroCliente = lazy(() => import("./pages/cliente/CadastroCliente"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEscritorios = lazy(() => import("./pages/admin/AdminEscritorios"));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios"));
const AdminAssinaturas = lazy(() => import("./pages/admin/AdminAssinaturas"));
const AdminBugReports = lazy(() => import("./pages/admin/AdminBugReports"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails"));
const AdminWebhooks = lazy(() => import("./pages/admin/AdminWebhooks"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const PoliticaDePrivacidade = lazy(() => import("./pages/PoliticaDePrivacidade"));
const PoliticaLGPD = lazy(() => import("./pages/PoliticaLGPD"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const SobreNos = lazy(() => import("./pages/SobreNos"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function FullscreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

function RootRedirect() {
  const { session, userType, loading: authLoading } = useAuth();
  const { isBlocked, loading: billingLoading } = useBillingStatus();

  if (authLoading || (session && userType === 'contador' && billingLoading)) {
    return <FullscreenSpinner />;
  }

  if (!session) return <LandingV2 />;
  if (userType === 'admin') return <Navigate to="/admin" replace />;
  
  if (userType === 'contador') {
    if (isBlocked) return <Navigate to="/checkout" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  
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
            <Suspense fallback={<RouteLoadingBar />}>
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
              <Route path="/admin/webhooks" element={<ProtectedRoute allowedType="admin"><AdminWebhooks /></ProtectedRoute>} />
              <Route path="/admin/configuracoes" element={<ProtectedRoute allowedType="admin"><AdminSettings /></ProtectedRoute>} />

              {/* Contador routes - billing gated */}
              <Route path="/dashboard" element={<ProtectedRoute allowedType="contador"><BillingGate><Dashboard /></BillingGate></ProtectedRoute>} />
              <Route path="/clientes/:id" element={<ProtectedRoute allowedType="contador"><BillingGate><ClientePerfil /></BillingGate></ProtectedRoute>} />
              <Route path="/declaracoes/:id" element={<ProtectedRoute allowedType="contador"><BillingGate><DeclaracaoDetalhe /></BillingGate></ProtectedRoute>} />
              <Route path="/declaracoes" element={<ProtectedRoute allowedType="contador"><BillingGate><Declaracoes /></BillingGate></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute allowedType="contador"><BillingGate><Clientes /></BillingGate></ProtectedRoute>} />
              <Route path="/cobrancas" element={<ProtectedRoute allowedType="contador"><BillingGate><Cobrancas /></BillingGate></ProtectedRoute>} />
              <Route path="/mensagens" element={<Navigate to="/configuracoes?tab=mensagens" replace />} />
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
            </Suspense>
            </ThemeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
