import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useMalhaFina() {
  const { profile } = useAuth();
  const escritorioId = profile.escritorioId;
  const queryClient = useQueryClient();
  const [anoBase, setAnoBase] = useState(new Date().getFullYear());
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const { data: consultas = [], isLoading, isError, error, refetch } = useQuery({
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
        .from('malha_fina_consultas')
        .select('*')
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', anoBase);

      const existingMap = new Map((existing || []).map((e: { declaracao_id: string }) => [e.declaracao_id, e]));

      // Create records for new transmissions
      const toInsert = decls.filter(d => !existingMap.has(d.id)).map(d => ({
        declaracao_id: d.id,
        escritorio_id: escritorioId,
        cliente_id: d.cliente_id,
        cpf: (d.clientes as unknown as { cpf: string })?.cpf || '',
        ano_base: anoBase,
        status_rfb: 'nao_consultado',
      }));

      if (toInsert.length) {
        await supabase.from('malha_fina_consultas').insert(toInsert);
      }

      // Re-fetch all
      const { data: all } = await supabase
        .from('malha_fina_consultas')
        .select('*, clientes(nome)')
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', anoBase)
        .order('created_at', { ascending: false });

      return all || [];
    },
    enabled: !!escritorioId,
  });

  // Real consultation via BrasilAPI edge function
  const consultMutation = useMutation({
    mutationFn: async (consulta: { id: string; cpf: string }) => {
      const { data, error } = await supabase.functions.invoke('consulta-rfb', {
        body: { cpf: consulta.cpf, consulta_id: consulta.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      const statusRfb = data.status_rfb;
      if (statusRfb === 'em_malha') {
        toast.error('⚠️ Declaração com risco de MALHA FINA!', {
          description: data.interpretacao?.alertas?.[0] || 'Verifique a situação do CPF.',
        });
      } else if (statusRfb === 'com_pendencias') {
        toast.warning('CPF com pendências', {
          description: data.interpretacao?.alertas?.[0] || 'Verifique a situação cadastral.',
        });
      } else {
        toast.success('CPF regular na Receita Federal');
      }
      queryClient.invalidateQueries({ queryKey: ['malha-fina'] });
    },
    onError: (err: Error) => {
      toast.error('Erro ao consultar CPF', { description: err.message });
    },
  });

  const consultarTodosMutation = useMutation({
    mutationFn: async () => {
      for (const c of consultas) {
        const item = c as { id: string; cpf: string };
        await consultMutation.mutateAsync({ id: item.id, cpf: item.cpf });
        // Small delay between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
    },
  });

  return {
    consultas,
    isLoading,
    isError,
    error,
    refetch,
    anoBase,
    setAnoBase,
    filtroStatus,
    setFiltroStatus,
    consultarIndividual: (id: string, cpf: string) => consultMutation.mutate({ id, cpf }),
    consultarTodos: () => consultarTodosMutation.mutate(),
    consultando: consultMutation.isPending || consultarTodosMutation.isPending,
  };
}
