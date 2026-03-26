import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

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
        .select('*')
        .eq('escritorio_id', escritorioId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!escritorioId,
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
        queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [escritorioId, queryClient]);

  const naoLidas = (query.data || []).filter((n: any) => !n.lida).length;

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
      // Use raw SQL-like approach to avoid deep type instantiation
      const notifs = (query.data || []).filter((n: any) => !n.lida);
      for (const n of notifs) {
        await (supabase as any).from('notificacoes').update({ lida: true }).eq('id', n.id);
      }
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
