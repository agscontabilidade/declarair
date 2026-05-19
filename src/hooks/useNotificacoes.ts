import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useDebouncedInvalidate } from '@/hooks/useDebouncedInvalidate';
import type { Tables } from '@/integrations/supabase/types';

type Notificacao = Tables<'notificacoes'>;

export function useNotificacoes() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const debouncedInvalidate = useDebouncedInvalidate(300);
  const escritorioId = profile.escritorioId;

  const query = useQuery({
    queryKey: ['notificacoes', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return [];
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('escritorio_id', escritorioId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as Notificacao[];
    },
    enabled: !!escritorioId,
    staleTime: 1000 * 60, // 1 minute
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
      }, () => {
        debouncedInvalidate(['notificacoes']);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [escritorioId, debouncedInvalidate]);

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
