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

async function triggerStatusAutomation(
  escritorioId: string,
  declaracaoId: string,
  newStatus: string,
  accessToken: string
) {
  try {
    // Check if automation is configured for this status
    const { data: configs } = await supabase
      .from('configuracoes_escritorio')
      .select('chave, valor')
      .eq('escritorio_id', escritorioId)
      .in('chave', [
        `whatsapp_auto_${newStatus}_ativo`,
        `whatsapp_auto_${newStatus}_template`,
      ]);

    if (!configs || configs.length === 0) return;

    const ativoConfig = configs.find(c => c.chave === `whatsapp_auto_${newStatus}_ativo`);
    const templateConfig = configs.find(c => c.chave === `whatsapp_auto_${newStatus}_template`);

    if (ativoConfig?.valor !== 'true' || !templateConfig?.valor) return;

    // Get declaration + client info
    const { data: decl } = await supabase
      .from('declaracoes')
      .select('*, clientes(nome, telefone, cpf)')
      .eq('id', declaracaoId)
      .single();

    if (!decl?.clientes) return;
    const clienteData = decl.clientes as unknown as { nome: string; telefone: string; cpf: string };
    if (!clienteData.telefone) return;

    // Get template
    const { data: tmpl } = await supabase
      .from('templates_mensagem')
      .select('id, corpo')
      .eq('id', templateConfig.valor)
      .eq('ativo', true)
      .single();

    if (!tmpl) return;

    // Get escritorio name
    const { data: esc } = await supabase
      .from('escritorios')
      .select('nome')
      .eq('id', escritorioId)
      .single();

    // Replace tags
    const statusLabels: Record<string, string> = {
      aguardando_documentos: 'Aguardando Documentos',
      documentacao_recebida: 'Documentação Recebida',
      declaracao_pronta: 'Declaração Pronta',
      transmitida: 'Transmitida',
    };

    const mensagem = tmpl.corpo
      .replace(/{nome_cliente}/g, clienteData.nome || '')
      .replace(/{nome_escritorio}/g, esc?.nome || '')
      .replace(/{ano_base}/g, String(decl.ano_base))
      .replace(/{status_declaracao}/g, statusLabels[newStatus] || newStatus)
      .replace(/{tipo_resultado}/g, decl.tipo_resultado || '')
      .replace(/{valor_resultado}/g, decl.valor_resultado ? String(decl.valor_resultado) : '')
      .replace(/{numero_recibo}/g, decl.numero_recibo || '')
      .replace(/{link_portal}/g, 'https://declarair.lovable.app/cliente/login');

    const phone = clienteData.telefone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    await fetch(`https://${projectId}.supabase.co/functions/v1/whatsapp-service?action=send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        phone: fullPhone,
        message: mensagem,
        clienteId: decl.cliente_id,
        templateId: tmpl.id,
      }),
    });
  } catch {
    // Silent fail - don't block Kanban move
  }
}

async function createInAppNotification(escritorioId: string, declaracaoId: string, newStatus: string) {
  try {
    const { data: decl } = await supabase
      .from('declaracoes')
      .select('ano_base, clientes(nome)')
      .eq('id', declaracaoId)
      .single();

    if (!decl) return;

    const statusLabels: Record<string, string> = {
      aguardando_documentos: 'Aguardando Documentos',
      documentacao_recebida: 'Documentação Recebida',
      declaracao_pronta: 'Declaração Pronta',
      transmitida: 'Transmitida',
    };

    const clienteNome = decl?.clientes ? (decl.clientes as unknown as { nome: string }).nome : 'Cliente';

    await supabase.from('notificacoes').insert({
      escritorio_id: escritorioId,
      titulo: `Declaração movida: ${clienteNome}`,
      mensagem: `A declaração ${decl.ano_base} foi movida para "${statusLabels[newStatus] || newStatus}".`,
      link_destino: `/declaracoes/${declaracaoId}`,
    });
  } catch {
    // Silent
  }
}

export function KanbanBoard({ items, isLoading, anoBase }: { items: DeclaracaoKanban[]; isLoading: boolean; anoBase: number }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [optimisticItems, setOptimisticItems] = useState<DeclaracaoKanban[] | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [droppedId, setDroppedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const displayItems = optimisticItems ?? items;

  const grouped = columns.reduce((acc, col) => {
    acc[col.status] = displayItems.filter(i => i.status === col.status);
    return acc;
  }, {} as Record<string, DeclaracaoKanban[]>);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverCol(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverCol(status);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggedId(null);
    const id = e.dataTransfer.getData('text/plain');
    const item = displayItems.find(i => i.id === id);
    if (!item || item.status === newStatus) return;

    setDroppedId(id);
    setTimeout(() => setDroppedId(null), 400);

    const prev = [...displayItems];
    setOptimisticItems(prev.map(i => i.id === id ? { ...i, status: newStatus } : i));

    // Optimistic locking: only update if version matches
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

      // Trigger automations in background
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto min-w-0">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.title}
            status={col.status}
            color={col.color}
            items={grouped[col.status] || []}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            draggedId={draggedId}
            droppedId={droppedId}
            isDragOver={dragOverCol === col.status}
          />
        ))}
      </div>
    </div>
  );
}
