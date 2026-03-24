import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DeclaracaoKanban {
  id: string;
  status: string;
  ano_base: number;
  ultima_atualizacao_status: string;
  contador_id: string | null;
  clientes: { nome: string; cpf: string } | null;
  contador: { nome: string } | null;
  pendingDocs: number;
  totalDocs: number;
}

export function useDashboardData(anoBase: number) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const escritorioId = profile.escritorioId;

  const kpis = useQuery({
    queryKey: ['dashboard-kpis', escritorioId, anoBase],
    queryFn: async () => {
      if (!escritorioId) return { totalClientes: 0, emAndamento: 0, docPendente: 0, transmitidas: 0 };

      const [clientes, emAndamento, docPendente, transmitidas] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId),
        supabase.from('declaracoes').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId).eq('ano_base', anoBase).neq('status', 'transmitida'),
        supabase.from('declaracoes').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId).eq('ano_base', anoBase).eq('status', 'aguardando_documentos'),
        supabase.from('declaracoes').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId).eq('ano_base', anoBase).eq('status', 'transmitida'),
      ]);

      return {
        totalClientes: clientes.count ?? 0,
        emAndamento: emAndamento.count ?? 0,
        docPendente: docPendente.count ?? 0,
        transmitidas: transmitidas.count ?? 0,
      };
    },
    enabled: !!escritorioId,
  });

  const declaracoes = useQuery({
    queryKey: ['dashboard-declaracoes', escritorioId, anoBase],
    queryFn: async (): Promise<DeclaracaoKanban[]> => {
      if (!escritorioId) return [];

      const { data, error } = await supabase
        .from('declaracoes')
        .select('id, status, ano_base, ultima_atualizacao_status, contador_id, clientes(nome, cpf), usuarios!declaracoes_contador_id_fkey(nome)')
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', anoBase);

      if (error) throw error;

      // Fetch pending docs counts
      const ids = (data || []).map(d => d.id);
      let pendingMap: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: docs } = await supabase
          .from('checklist_documentos')
          .select('declaracao_id, status')
          .in('declaracao_id', ids)
          .eq('status', 'pendente');
        if (docs) {
          for (const doc of docs) {
            pendingMap[doc.declaracao_id] = (pendingMap[doc.declaracao_id] || 0) + 1;
          }
        }
      }

      return (data || []).map((d: any) => ({
        id: d.id,
        status: d.status,
        ano_base: d.ano_base,
        ultima_atualizacao_status: d.ultima_atualizacao_status,
        contador_id: d.contador_id,
        clientes: d.clientes,
        contador: d.usuarios ? { nome: d.usuarios.nome } : null,
        pendingDocs: pendingMap[d.id] || 0,
      }));
    },
    enabled: !!escritorioId,
  });

  useEffect(() => {
    if (!escritorioId) return;
    const channel = supabase
      .channel('dashboard-declaracoes-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'declaracoes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-kpis', escritorioId, anoBase] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes', escritorioId, anoBase] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [escritorioId, anoBase, queryClient]);

  return { kpis, declaracoes };
}
