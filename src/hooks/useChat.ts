import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  conteudo: string;
  remetente_tipo: 'contador' | 'cliente';
  remetente_id: string;
  tipo: string;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  created_at: string;
  lida_por_cliente: boolean;
  lida_pelo_contador: boolean;
}

export function useChat(declaracaoId: string | undefined, escritorioId: string | undefined, clienteId: string | undefined, senderType: 'contador' | 'cliente', senderId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', declaracaoId],
    queryFn: async () => {
      if (!declaracaoId) return [];
      const { data, error } = await (supabase as any)
        .from('mensagens_chat')
        .select('*')
        .eq('declaracao_id', declaracaoId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ChatMessage[];
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
      const { error } = await (supabase as any)
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

  // Mark messages as read
  const markRead = useCallback(async () => {
    if (!declaracaoId || !messages.length) return;
    const field = senderType === 'contador' ? 'lida_pelo_contador' : 'lida_por_cliente';
    const unread = messages.filter(m => !(m as any)[field] && m.remetente_tipo !== senderType);
    if (unread.length === 0) return;
    await supabase
      .from('mensagens_chat' as any)
      .update({ [field]: true })
      .in('id', unread.map(m => m.id));
  }, [declaracaoId, messages, senderType]);

  const unreadCount = messages.filter(m => {
    const field = senderType === 'contador' ? 'lida_pelo_contador' : 'lida_por_cliente';
    return !(m as any)[field] && m.remetente_tipo !== senderType;
  }).length;

  return { messages, isLoading, sendMessage, markRead, unreadCount };
}
