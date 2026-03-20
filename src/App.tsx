import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Cobrancas from "./pages/Cobrancas";
import Mensagens from "./pages/Mensagens";
import Configuracoes from "./pages/Configuracoes";
import ClienteLogin from "./pages/cliente/ClienteLogin";
import ConviteCliente from "./pages/cliente/ConviteCliente";
import ClienteDashboard from "./pages/cliente/ClienteDashboard";
import ClienteFormulario from "./pages/cliente/ClienteFormulario";
import ClienteDocumentos from "./pages/cliente/ClienteDocumentos";
import ClientePerfil from "./pages/ClientePerfil";
import DeclaracaoDetalhe from "./pages/DeclaracaoDetalhe";
import NotFound from "./pages/NotFound";

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

  if (!session) return <Navigate to="/login" replace />;
  if (userType === 'contador') return <Navigate to="/dashboard" replace />;
  if (userType === 'cliente') return <Navigate to="/cliente/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cliente/login" element={<ClienteLogin />} />
            <Route path="/cliente/convite/:token" element={<ConviteCliente />} />

            {/* Contador routes */}
            <Route path="/dashboard" element={<ProtectedRoute allowedType="contador"><Dashboard /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute allowedType="contador"><Clientes /></ProtectedRoute>} />
            <Route path="/cobrancas" element={<ProtectedRoute allowedType="contador"><Cobrancas /></ProtectedRoute>} />
            <Route path="/mensagens" element={<ProtectedRoute allowedType="contador"><Mensagens /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute allowedType="contador"><Configuracoes /></ProtectedRoute>} />

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
);

export default App;
