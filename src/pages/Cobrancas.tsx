import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useCobrancas } from '@/hooks/useCobrancas';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CobrancasTable } from '@/components/cobrancas/CobrancasTable';
import { CobrancaModal } from '@/components/cobrancas/CobrancaModal';
import { ConfirmModal } from '@/components/cobrancas/ConfirmModal';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryError } from '@/components/ui/QueryError';

export default function Cobrancas() {
  const [statusFilter, setStatusFilter] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancelar' | 'excluir'; id: string } | null>(null);
  const { profile } = useAuth();

  const { cobrancas, isLoading, isError, error, refetch, kpis, marcarPago, cancelar, excluir, criar, editar } = useCobrancas(statusFilter);

  // Check if Inter is configured
  const { data: interAtivo } = useQuery({
    queryKey: ['inter-ativo', profile.escritorioId],
    queryFn: async () => {
      if (!profile.escritorioId) return false;
      const { data } = await supabase.from('configuracoes_escritorio').select('valor').eq('escritorio_id', profile.escritorioId).eq('chave', 'inter_ativo').single();
      return data?.valor === 'true';
    },
    enabled: !!profile.escritorioId,
  });

  const handleSave = (data: { id?: string; cliente_id: string; declaracao_id?: string; descricao: string; valor: number; data_vencimento: string }) => {
    if (data.id) {
      editar.mutate({ ...data, id: data.id }, { onSuccess: () => { setModalOpen(false); setEditData(null); } });
    } else {
      criar.mutate(data, { onSuccess: () => { setModalOpen(false); setEditData(null); } });
    }
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'cancelar') {
      cancelar.mutate(confirmAction.id, { onSuccess: () => setConfirmAction(null) });
    } else {
      excluir.mutate(confirmAction.id, { onSuccess: () => setConfirmAction(null) });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Cobranças</h1>
          <Button className="active:scale-[0.98]" onClick={() => { setEditData(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Nova Cobrança
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)
          ) : (
            <>
              <Card className="shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total a Receber</p>
                    <p className="text-xl font-bold tabular-nums">{formatCurrency(kpis.totalReceber)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Recebido no Ano</p>
                    <p className="text-xl font-bold tabular-nums">{formatCurrency(kpis.recebidoAno)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Atrasado</p>
                    <p className="text-xl font-bold tabular-nums">{formatCurrency(kpis.atrasado)}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Filters + Table */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CobrancasTable
              cobrancas={cobrancas}
              isLoading={isLoading}
              onMarcarPago={(id) => marcarPago.mutate(id)}
              onEditar={(c) => { setEditData(c); setModalOpen(true); }}
              onCancelar={(id) => setConfirmAction({ type: 'cancelar', id })}
              onExcluir={(id) => setConfirmAction({ type: 'excluir', id })}
              interAtivo={interAtivo || false}
            />
          </CardContent>
        </Card>
      </div>

      <CobrancaModal
        open={modalOpen}
        onOpenChange={(v) => { setModalOpen(v); if (!v) setEditData(null); }}
        onSave={handleSave}
        loading={criar.isPending || editar.isPending}
        editData={editData}
      />

      <ConfirmModal
        open={!!confirmAction}
        onOpenChange={(v) => { if (!v) setConfirmAction(null); }}
        title={confirmAction?.type === 'cancelar' ? 'Cancelar Cobrança' : 'Excluir Cobrança'}
        description={confirmAction?.type === 'cancelar' ? 'Tem certeza que deseja cancelar esta cobrança?' : 'Esta ação é irreversível. Deseja excluir?'}
        onConfirm={handleConfirm}
        loading={cancelar.isPending || excluir.isPending}
      />
    </DashboardLayout>
  );
}
