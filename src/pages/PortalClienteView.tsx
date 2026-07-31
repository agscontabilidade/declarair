import { lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PortalViewProvider, usePortalView } from '@/contexts/PortalViewContext';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryError } from '@/components/ui/QueryError';

const ClienteDashboard = lazy(() => import('@/pages/cliente/ClienteDashboard'));
const ClienteFormulario = lazy(() => import('@/pages/cliente/ClienteFormulario'));
const ClienteDocumentos = lazy(() => import('@/pages/cliente/ClienteDocumentos'));

function PortalSwitch() {
  const portal = usePortalView();
  if (!portal) return null;
  if (portal.view === 'formulario') return <ClienteFormulario />;
  if (portal.view === 'documentos') return <ClienteDocumentos />;
  return <ClienteDashboard />;
}

export default function PortalClienteView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: cliente, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['portal-view-cliente', id],
    queryFn: async () => {
      if (!id) return null;
      // RLS garante que o contador só enxerga clientes do próprio escritório
      const { data, error: err } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('id', id)
        .maybeSingle();
      if (err) throw err;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <QueryError message={error?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-medium">Cliente não encontrado ou fora do seu escritório.</p>
        <button
          onClick={() => navigate('/clientes')}
          className="text-sm text-accent underline"
        >
          Voltar para clientes
        </button>
      </div>
    );
  }

  return (
    <PortalViewProvider clienteId={cliente.id} clienteNome={cliente.nome}>
      <Suspense
        fallback={
          <div className="min-h-screen p-6 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <PortalSwitch />
      </Suspense>
    </PortalViewProvider>
  );
}
