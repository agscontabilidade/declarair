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
  version: number;
  recibo_validado_em: string | null;
  arquivo_recibo_url: string | null;
  numero_recibo: string | null;
  data_transmissao: string | null;
  observacoes_cliente: string | null;
  observacoes_cliente_atualizado_em: string | null;
  observacoes_cliente_lida_em: string | null;
  created_at: string;
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
  observacoes_cliente: string | null;
  observacoes_cliente_atualizado_em: string | null;
  observacoes_cliente_lida_em: string | null;
  created_at: string;
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

      const { data, error } = await supabase.rpc('dashboard_kpis', {
        p_escritorio_id: escritorioId,
        p_ano_base: anoBase,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return {
        totalClientes: row?.total_clientes ?? 0,
        emAndamento: row?.em_andamento ?? 0,
        docPendente: row?.doc_pendente ?? 0,
        transmitidas: row?.transmitidas ?? 0,
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
        .select('id, status, ano_base, ultima_atualizacao_status, contador_id, version, recibo_validado_em, arquivo_recibo_url, numero_recibo, data_transmissao, observacoes_cliente, observacoes_cliente_atualizado_em, observacoes_cliente_lida_em, created_at, clientes(nome, cpf), usuarios!declaracoes_contador_id_fkey(nome)')
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', anoBase);

      if (error) throw error;

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
          version: row.version,
          recibo_validado_em: row.recibo_validado_em,
          arquivo_recibo_url: row.arquivo_recibo_url,
          numero_recibo: row.numero_recibo,
          data_transmissao: row.data_transmissao,
          observacoes_cliente: row.observacoes_cliente,
          observacoes_cliente_atualizado_em: row.observacoes_cliente_atualizado_em,
          observacoes_cliente_lida_em: row.observacoes_cliente_lida_em,
          created_at: row.created_at,
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
