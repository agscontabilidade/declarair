import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDebouncedInvalidate } from '@/hooks/useDebouncedInvalidate';

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
  version: number;
  recibo_validado_em: string | null;
  arquivo_recibo_url: string | null;
  numero_recibo: string | null;
  data_transmissao: string | null;
}


interface DeclaracaoRow {
  id: string;
  status: string;
  ano_base: number;
  ultima_atualizacao_status: string;
  contador_id: string | null;
  version: number;
  recibo_validado_em: string | null;
  arquivo_recibo_url: string | null;
  numero_recibo: string | null;
  data_transmissao: string | null;
  clientes: { nome: string; cpf: string } | null;
  usuarios: { nome: string } | null;
}

export function useDashboardData(anoBase: number) {
  const { profile } = useAuth();
  const debouncedInvalidate = useDebouncedInvalidate(300);
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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const declaracoes = useQuery({
    queryKey: ['dashboard-declaracoes', escritorioId, anoBase],
    queryFn: async (): Promise<DeclaracaoKanban[]> => {
      if (!escritorioId) return [];

      const { data, error } = await supabase
        .from('declaracoes')
        .select('id, status, ano_base, ultima_atualizacao_status, contador_id, version, clientes(nome, cpf), usuarios!declaracoes_contador_id_fkey(nome)')
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', anoBase);

      if (error) throw error;

      // Fetch doc counts (total + pending)
      const ids = (data || []).map(d => d.id);
      const pendingMap: Record<string, number> = {};
      const totalMap: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: docs } = await supabase
          .from('checklist_documentos')
          .select('declaracao_id, status')
          .in('declaracao_id', ids);
        if (docs) {
          for (const doc of docs) {
            totalMap[doc.declaracao_id] = (totalMap[doc.declaracao_id] || 0) + 1;
            if (doc.status === 'pendente') {
              pendingMap[doc.declaracao_id] = (pendingMap[doc.declaracao_id] || 0) + 1;
            }
          }
        }
      }

      return (data || []).map((d) => {
        const row = d as unknown as DeclaracaoRow;
        return {
          id: row.id,
          status: row.status,
          ano_base: row.ano_base,
          ultima_atualizacao_status: row.ultima_atualizacao_status,
          contador_id: row.contador_id,
          clientes: row.clientes,
          contador: row.usuarios ? { nome: row.usuarios.nome } : null,
          pendingDocs: pendingMap[row.id] || 0,
          totalDocs: totalMap[row.id] || 0,
          version: row.version,
        };
      });
    },
    enabled: !!escritorioId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  useEffect(() => {
    if (!escritorioId) return;
    const channel = supabase
      .channel('dashboard-declaracoes-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'declaracoes', filter: `escritorio_id=eq.${escritorioId}` }, () => {
        debouncedInvalidate(['dashboard-kpis', escritorioId, anoBase]);
        debouncedInvalidate(['dashboard-declaracoes', escritorioId, anoBase]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [escritorioId, anoBase, debouncedInvalidate]);

  return { kpis, declaracoes };
}
