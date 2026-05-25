import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
// debounced invalidate removido — cache é atualizado direto pelo realtime
import type { Tables } from '@/integrations/supabase/types';

type Notificacao = Tables<'notificacoes'>;

export function useNotificacoes() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const escritorioId = profile.escritorioId;

  const query = useQuery({
    queryKey: ['notificacoes', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return [];
      const { data, error } = await supabase
        .from('notificacoes')
        .select('id, escritorio_id, titulo, mensagem, link_destino, lida, created_at')
        .eq('escritorio_id', escritorioId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as Notificacao[];
    },
    enabled: !!escritorioId,
    staleTime: 1000 * 60 * 5, // 5 minutes — realtime keeps cache fresh on INSERT
  });

  useEffect(() => {
    if (!escritorioId) return;
    const channel = supabase
      .channel('notificacoes-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `escritorio_id=eq.${escritorioId}`,
      }, (payload) => {
        // Atualiza o cache diretamente em vez de invalidar (evita refetch)
        queryClient.setQueryData<Notificacao[]>(['notificacoes', escritorioId], (old = []) => {
          const novo = payload.new as Notificacao;
          if (old.some((n) => n.id === novo.id)) return old;
          return [novo, ...old].slice(0, 20);
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [escritorioId, queryClient]);

  const naoLidas = (query.data || []).filter((n) => !n.lida).length;

  const marcarComoLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] }),
  });

  const marcarTodasComoLidas = useMutation({
    mutationFn: async () => {
      if (!escritorioId) return;
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('escritorio_id', escritorioId)
        .eq('lida', false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificacoes'] }),
  });

  return {
    notificacoes: query.data || [],
    naoLidas,
    isLoading: query.isLoading,
    marcarComoLida,
    marcarTodasComoLidas,
  };
}
