import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { KanbanColumn } from './KanbanColumn';
import { Skeleton } from '@/components/ui/skeleton';
import type { DeclaracaoKanban } from '@/hooks/useDashboardData';

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

  const displayItems = optimisticItems ?? items;

  const grouped = columns.reduce((acc, col) => {
    acc[col.status] = displayItems.filter(i => i.status === col.status);
    return acc;
  }, {} as Record<string, DeclaracaoKanban[]>);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const item = displayItems.find(i => i.id === id);
    if (!item || item.status === newStatus) return;

    // Optimistic update
    const prev = [...displayItems];
    setOptimisticItems(prev.map(i => i.id === id ? { ...i, status: newStatus } : i));

    const { error } = await supabase
      .from('declaracoes')
      .update({ status: newStatus, ultima_atualizacao_status: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      setOptimisticItems(prev);
      toast({ title: 'Erro ao mover', description: error.message, variant: 'destructive' });
    } else {
      setOptimisticItems(null);
      queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes', profile.escritorioId, anoBase] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis', profile.escritorioId, anoBase] });
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.title}
            status={col.status}
            color={col.color}
            items={grouped[col.status] || []}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
