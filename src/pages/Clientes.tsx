import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { ClientesTable, type ClienteRow } from '@/components/clientes/ClientesTable';
import { ClienteModal } from '@/components/clientes/ClienteModal';
import { ClienteViewModal } from '@/components/clientes/ClienteViewModal';
import { CobrancaModal } from '@/components/cobrancas/CobrancaModal';
import { DocumentosDeclaracaoModal } from '@/components/declaracoes/DocumentosDeclaracaoModal';
import { EnviarConviteClienteDialog, type EnviarConviteClienteCtx } from '@/components/clientes/EnviarConviteClienteDialog';
import { useCobrancas } from '@/hooks/useCobrancas';
import { QueryError } from '@/components/ui/QueryError';
import { ClientesFilters } from '@/components/clientes/ClientesFilters';
import type { ClienteWithContador } from '@/types/domain';
import { usePermissoes } from '@/hooks/usePermissoes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/integrations/supabase/client';

export default function Clientes() {
  const {
    clientes, isLoading, isError, error, refetch,
    search, setSearch, page, setPage, totalPages,
    contadores, createCliente, updateCliente, deleteCliente, clientesComCobranca, clientesComObservacao,
    ordenacao, setOrdenacao,
    filtroProcuracao, setFiltroProcuracao,
    filtroCobranca, setFiltroCobranca,
  } = useClientes();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewCliente, setViewCliente] = useState<ClienteRow | null>(null);
  const [editCliente, setEditCliente] = useState<ClienteRow | null>(null);
  const [cobrancaCliente, setCobrancaCliente] = useState<ClienteRow | null>(null);
  const [uploadDocs, setUploadDocs] = useState<{ declaracaoId: string; nome: string } | null>(null);
  const [conviteCtx, setConviteCtx] = useState<EnviarConviteClienteCtx | null>(null);
  const { criar: criarCobranca } = useCobrancas('todos');
  const { podeVerClientes, podeCriarClientes, podeEditarClientes, podeExcluirCliente } = usePermissoes();
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
            {podeCriarClientes && (
              <Button className="gap-2" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ClientesFilters
            ordenacao={ordenacao}
            onOrdenacaoChange={setOrdenacao}
            filtroProcuracao={filtroProcuracao}
            onFiltroProcuracaoChange={setFiltroProcuracao}
            filtroCobranca={filtroCobranca}
            onFiltroCobrancaChange={setFiltroCobranca}
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
              onCobranca={(c) => setCobrancaCliente(c)}
              onConvite={async (c) => {
                let tokenExistente: string | null = null;
                let podeReusar = false;
                if (c.status_onboarding === 'convite_enviado') {
                  const { data } = await supabase.rpc('get_cliente_invite_token', { _cliente_id: c.id });
                  const row = Array.isArray(data) ? data[0] : null;
                  const tokenValido = !!row?.token_convite_expira_em && new Date(row.token_convite_expira_em) > new Date();
                  if (tokenValido && row?.token_convite) {
                    podeReusar = true;
                    tokenExistente = row.token_convite as string;
                  }
                }
                setConviteCtx({
                  clienteId: c.id,
                  nome: c.nome,
                  email: c.email ?? null,
                  telefone: c.telefone ?? null,
                  mode: podeReusar ? 'reusar' : 'novo',
                  tokenExistente,
                });
              }}
              canEdit={podeEditarClientes}
              canDelete={podeExcluirCliente}
              clientesComCobranca={clientesComCobranca}
              clientesComObservacao={clientesComObservacao}
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
        onSavedAndUpload={(ctx) => {
          if (ctx.declaracaoId) setUploadDocs({ declaracaoId: ctx.declaracaoId, nome: ctx.nome });
        }}
        onSavedAndInvite={(ctx) => {
          setConviteCtx({
            clienteId: ctx.clienteId,
            nome: ctx.nome,
            email: ctx.email ?? null,
            telefone: ctx.telefone ?? null,
          });
        }}
      />

      <EnviarConviteClienteDialog ctx={conviteCtx} onClose={() => setConviteCtx(null)} />

      <DocumentosDeclaracaoModal
        open={!!uploadDocs}
        onOpenChange={(o) => !o && setUploadDocs(null)}
        declaracaoId={uploadDocs?.declaracaoId ?? null}
        clienteNome={uploadDocs?.nome}
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

      <CobrancaModal
        open={!!cobrancaCliente}
        onOpenChange={(o) => !o && setCobrancaCliente(null)}
        clienteIdLocked={cobrancaCliente?.id ?? null}
        clienteNomeLocked={cobrancaCliente?.nome ?? null}
        loading={criarCobranca.isPending}
        onSave={(data) => {
          criarCobranca.mutate(
            data as { cliente_id: string; declaracao_id?: string; descricao: string; valor: number; data_vencimento: string },
            { onSuccess: () => setCobrancaCliente(null) },
          );
        }}
      />
    </DashboardLayout>
  );
}
