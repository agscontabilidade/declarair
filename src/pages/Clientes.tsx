import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import GerarLinkConvite from '@/components/clientes/GerarLinkConvite';
import { useClientes } from '@/hooks/useClientes';
import { ClientesTable, type ClienteRow } from '@/components/clientes/ClientesTable';
import { ClienteModal } from '@/components/clientes/ClienteModal';
import { ClienteViewModal } from '@/components/clientes/ClienteViewModal';
import { CobrancaModal } from '@/components/cobrancas/CobrancaModal';
import { useCobrancas } from '@/hooks/useCobrancas';
import { QueryError } from '@/components/ui/QueryError';
import type { ClienteWithContador } from '@/types/domain';
import { usePermissoes } from '@/hooks/usePermissoes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errors';

export default function Clientes() {
  const {
    clientes, isLoading, isError, error, refetch,
    search, setSearch, page, setPage, totalPages,
    contadores, createCliente, updateCliente, deleteCliente,
  } = useClientes();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewCliente, setViewCliente] = useState<ClienteRow | null>(null);
  const [editCliente, setEditCliente] = useState<ClienteRow | null>(null);
  const { podeVerClientes, podeCriarClientes, isDono } = usePermissoes();
  const { toast } = useToast();

  if (!podeVerClientes) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Clientes</h1>
          <Alert variant="destructive" className="max-w-md">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acesso negado</AlertTitle>
            <AlertDescription>Você não tem permissão para visualizar clientes.</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Clientes</h1>
          <QueryError message={error?.message} onRetry={() => refetch()} />
        </div>
      </DashboardLayout>
    );
  }

  const handleDelete = async (cliente: ClienteRow) => {
    try {
      await deleteCliente.mutateAsync(cliente.id);
      toast({ title: 'Cliente excluído com sucesso' });
    } catch (err: unknown) {
      toast({ title: 'Erro ao excluir', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleEditFromView = (c: ClienteWithContador) => {
    setViewCliente(null);
    setEditCliente(c);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Clientes</h1>
          <div className="flex gap-2">
            {isDono && <GerarLinkConvite />}
            {podeCriarClientes && (
              <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            )}
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ClientesTable
              clientes={clientes as ClienteRow[]}
              isLoading={isLoading}
              onView={(c) => setViewCliente(c)}
              onEdit={(c) => setEditCliente(c)}
              onDelete={handleDelete}
              canEdit={podeCriarClientes}
              canDelete={podeCriarClientes}
            />
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <ClienteModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        contadores={contadores}
        onSave={(data) => createCliente.mutateAsync(data as Parameters<typeof createCliente.mutateAsync>[0])}
        mode="create"
      />

      <ClienteModal
        open={!!editCliente}
        onOpenChange={(o) => !o && setEditCliente(null)}
        contadores={contadores}
        onSave={(data) => updateCliente.mutateAsync(data as Parameters<typeof updateCliente.mutateAsync>[0])}
        mode="edit"
        cliente={editCliente}
      />

      <ClienteViewModal
        open={!!viewCliente}
        onOpenChange={(o) => !o && setViewCliente(null)}
        cliente={viewCliente}
        onEdit={handleEditFromView}
      />
    </DashboardLayout>
  );
}
