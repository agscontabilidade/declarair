import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type MensagemChat = Tables<'mensagens_chat'>;

export function useChat(declaracaoId: string | undefined, escritorioId: string | undefined, clienteId: string | undefined, senderType: 'contador' | 'cliente', senderId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', declaracaoId],
    queryFn: async () => {
      if (!declaracaoId) return [];
      const { data, error } = await supabase
        .from('mensagens_chat')
        .select('*')
        .eq('declaracao_id', declaracaoId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as MensagemChat[];
    },
    enabled: !!declaracaoId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!declaracaoId) return;
    const channel = supabase
      .channel(`chat-${declaracaoId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens_chat',
        filter: `declaracao_id=eq.${declaracaoId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', declaracaoId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [declaracaoId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (conteudo: string) => {
      if (!declaracaoId || !escritorioId || !clienteId || !senderId) throw new Error('Dados incompletos');
      const { error } = await supabase
        .from('mensagens_chat')
        .insert({
          declaracao_id: declaracaoId,
          escritorio_id: escritorioId,
          cliente_id: clienteId,
          remetente_tipo: senderType,
          remetente_id: senderId,
          conteudo,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', declaracaoId] });
    },
  });

  // Mark messages as read — these fields don't exist in the schema yet,
  // so markRead is a no-op placeholder for now
  const markRead = useCallback(async () => {
    // No-op: lida_por_cliente / lida_pelo_contador columns not in current schema
  }, []);

  const unreadCount = 0;

  return { messages, isLoading, sendMessage, markRead, unreadCount };
}
