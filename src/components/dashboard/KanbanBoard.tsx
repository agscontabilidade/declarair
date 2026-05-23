import { useState, useCallback, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { DeclaracaoKanban } from '@/hooks/useDashboardData';
import { triggerStatusAutomation, createInAppNotification } from './kanbanAutomations';

const columns = [
  { status: 'aguardando_documentos', title: 'Aguardando Documentação', color: 'bg-warning/10' },
  { status: 'documentacao_recebida', title: 'Documentação Recebida', color: 'bg-accent/10' },
  { status: 'declaracao_pronta', title: 'Declaração Pronta', color: 'bg-success/10' },
  { status: 'transmitida', title: 'Transmitidas', color: 'bg-muted' },
];

export function KanbanBoard({ items, isLoading, anoBase }: { items: DeclaracaoKanban[]; isLoading: boolean; anoBase: number }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [optimisticItems, setOptimisticItems] = useState<DeclaracaoKanban[] | null>(null);
  const [activeItem, setActiveItem] = useState<DeclaracaoKanban | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const displayItems = optimisticItems ?? items;

  const grouped = useMemo(() => {
    const acc: Record<string, DeclaracaoKanban[]> = {};
    for (const col of columns) acc[col.status] = [];
    for (const item of displayItems) {
      if (acc[item.status]) acc[item.status].push(item);
    }
    return acc;
  }, [displayItems]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = displayItems.find(i => i.id === event.active.id);
    setActiveItem(item || null);
  }, [displayItems]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const id = active.id as string;
    const newStatus = over.id as string;
    const item = displayItems.find(i => i.id === id);

    if (!item || item.status === newStatus) return;
    if (!columns.some(c => c.status === newStatus)) return;

    // Trava de regressão: declaração com sinal objetivo de transmissão
    // (recibo validado, número de recibo, data de transmissão, arquivo de recibo
    // ou já marcada como transmitida) não pode voltar para status anterior.
    const jaTransmitida =
      item.status === 'transmitida' ||
      !!item.recibo_validado_em ||
      !!item.arquivo_recibo_url ||
      !!item.numero_recibo ||
      !!item.data_transmissao;
    if (jaTransmitida && newStatus !== 'transmitida') {
      toast({
        title: 'Movimento bloqueado',
        description: 'Esta declaração já foi transmitida (recibo validado). Não é possível voltar para um status anterior.',
        variant: 'destructive',
      });
      return;
    }


    const prev = [...displayItems];
    setOptimisticItems(prev.map(i => i.id === id ? { ...i, status: newStatus } : i));

    const { data, error } = await supabase
      .from('declaracoes')
      .update({ status: newStatus, ultima_atualizacao_status: new Date().toISOString() })
      .eq('id', id)
      .eq('version', item.version)
      .select()
      .single();

    if (error || !data) {
      setOptimisticItems(prev);
      toast({
        title: 'Conflito detectado',
        description: 'A declaração foi modificada por outro usuário. Recarregando...',
        variant: 'destructive',
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes', profile.escritorioId, anoBase] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-kpis', profile.escritorioId, anoBase] });
      }, 1500);
    } else {
      setOptimisticItems(null);
      queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes', profile.escritorioId, anoBase] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis', profile.escritorioId, anoBase] });

      if (profile.escritorioId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          triggerStatusAutomation(profile.escritorioId, id, newStatus, session.access_token);
        }
        createInAppNotification(profile.escritorioId, id, newStatus);
      }
    }
  }, [displayItems, profile.escritorioId, anoBase, queryClient, toast]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(c => (
          <div key={c.status} className="space-y-2">
            <Skeleton className="h-10 w-full rounded-t-xl" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold mb-4">Declarações por Status</h2>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto min-w-0">
          {columns.map((col) => (
            <KanbanColumn
              key={col.status}
              title={col.title}
              status={col.status}
              color={col.color}
              items={grouped[col.status] || []}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          {activeItem ? <KanbanCard item={activeItem} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
