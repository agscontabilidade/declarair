import { useState, useEffect, useCallback, useMemo } from 'react';
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
      }, (payload) => {
        // Optimistically add the new message to the cache
        queryClient.setQueryData(
          ['chat-messages', declaracaoId],
          (old: MensagemChat[] = []) => {
            const newMsg = payload.new as MensagemChat;
            // Avoid duplicates
            if (old.some(m => m.id === newMsg.id)) return old;
            return [...old, newMsg];
          }
        );
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
  });

  // Mark messages from the OTHER side as read
  const markRead = useCallback(async () => {
    if (!declaracaoId) return;
    const otherType = senderType === 'cliente' ? 'contador' : 'cliente';
    try {
      await supabase.rpc('marcar_mensagens_lidas', {
        p_declaracao_id: declaracaoId,
        p_remetente_tipo: otherType,
      });
    } catch {
      // Silently fail — non-critical
    }
  }, [declaracaoId, senderType]);

  // Count unread messages from the other side
  const unreadCount = useMemo(() => {
    const otherType = senderType === 'cliente' ? 'contador' : 'cliente';
    return messages.filter(m => m.remetente_tipo === otherType && !(m as MensagemChat & { lida?: boolean }).lida).length;
  }, [messages, senderType]);

  return { messages, isLoading, sendMessage, markRead, unreadCount };
}
