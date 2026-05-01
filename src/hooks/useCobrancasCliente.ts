import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CobrancaCliente {
  id: string;
  descricao: string;
  valor: number;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  data_vencimento: string;
  data_pagamento: string | null;
}

export function useCobrancasCliente(clienteId: string | undefined | null) {
  return useQuery({
    queryKey: ['cobrancas-cliente', clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cobrancas')
        .select('id, descricao, valor, status, data_vencimento, data_pagamento')
        .eq('cliente_id', clienteId!)
        .order('data_vencimento', { ascending: false });
      if (error) throw error;

      const list = (data || []) as CobrancaCliente[];
      const totalPago = list.filter(c => c.status === 'pago').reduce((s, c) => s + Number(c.valor), 0);
      const totalPendente = list.filter(c => c.status === 'pendente').reduce((s, c) => s + Number(c.valor), 0);
      const totalAtrasado = list.filter(c => c.status === 'atrasado').reduce((s, c) => s + Number(c.valor), 0);

      return {
        cobrancas: list,
        recentes: list.slice(0, 5),
        totalPago,
        totalPendente,
        totalAtrasado,
      };
    },
  });
}
