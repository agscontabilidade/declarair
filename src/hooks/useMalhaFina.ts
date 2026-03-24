import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SIMULATED_STATUSES = ['em_processamento', 'processada', 'em_malha', 'com_pendencias'];

export function useMalhaFina() {
  const { profile } = useAuth();
  const escritorioId = profile.escritorioId;
  const queryClient = useQueryClient();
  const [anoBase, setAnoBase] = useState(new Date().getFullYear());
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const { data: consultas = [], isLoading } = useQuery({
    queryKey: ['malha-fina', escritorioId, anoBase],
    queryFn: async () => {
      if (!escritorioId) return [];
      // Get transmitted declarations for this year
      const { data: decls } = await supabase
        .from('declaracoes')
        .select('id, cliente_id, ano_base, clientes(id, nome, cpf)')
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', anoBase)
        .eq('status', 'transmitida');

      if (!decls?.length) return [];

      // Get existing malha_fina records
      const { data: existing } = await supabase
        .from('malha_fina_consultas' as any)
        .select('*')
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', anoBase);

      const existingMap = new Map((existing || []).map((e: any) => [e.declaracao_id, e]));

      // Create records for new transmissions
      const toInsert = decls.filter(d => !existingMap.has(d.id)).map(d => ({
        declaracao_id: d.id,
        escritorio_id: escritorioId,
        cliente_id: d.cliente_id,
        cpf: (d.clientes as any)?.cpf || '',
        ano_base: anoBase,
        status_rfb: 'nao_consultado',
      }));

      if (toInsert.length) {
        await supabase.from('malha_fina_consultas' as any).insert(toInsert);
      }

      // Re-fetch all
      const { data: all } = await supabase
        .from('malha_fina_consultas' as any)
        .select('*, clientes(nome)')
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', anoBase)
        .order('created_at', { ascending: false });

      return all || [];
    },
    enabled: !!escritorioId,
  });

  const consultMutation = useMutation({
    mutationFn: async (id: string) => {
      // Simulated consultation - random status
      const newStatus = SIMULATED_STATUSES[Math.floor(Math.random() * SIMULATED_STATUSES.length)];
      const resultado = newStatus === 'em_malha'
        ? 'Declaração retida para análise. Verifique possíveis divergências de rendimentos.'
        : newStatus === 'processada'
        ? 'Declaração processada sem pendências.'
        : newStatus === 'com_pendencias'
        ? 'Pendência identificada. Verificar informações de rendimentos.'
        : 'Declaração em processamento pela RFB.';

      const { error } = await supabase
        .from('malha_fina_consultas' as any)
        .update({
          status_rfb: newStatus,
          ultimo_resultado: resultado,
          ultima_consulta: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      if (newStatus === 'em_malha') {
        toast.error('⚠️ Declaração em MALHA FINA!', { description: resultado });
      } else {
        toast.success(`Status atualizado: ${newStatus.replace(/_/g, ' ')}`);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['malha-fina'] }),
    onError: () => toast.error('Erro ao consultar status'),
  });

  const consultarTodosMutation = useMutation({
    mutationFn: async () => {
      for (const c of consultas) {
        await consultMutation.mutateAsync(c.id);
        await new Promise(r => setTimeout(r, 300));
      }
    },
  });

  return {
    consultas,
    isLoading,
    anoBase,
    setAnoBase,
    filtroStatus,
    setFiltroStatus,
    consultarIndividual: (id: string) => consultMutation.mutate(id),
    consultarTodos: () => consultarTodosMutation.mutate(),
    consultando: consultMutation.isPending || consultarTodosMutation.isPending,
  };
}
