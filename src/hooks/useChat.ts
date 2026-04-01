import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type MensagemChat = Tables<'mensagens_chat'> & { enviado_whatsapp?: boolean };

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
        queryClient.setQueryData(
          ['chat-messages', declaracaoId],
          (old: MensagemChat[] = []) => {
            const newMsg = payload.new as MensagemChat;
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

      // Save message to DB
      const { data: mensagem, error } = await supabase
        .from('mensagens_chat')
        .insert({
          declaracao_id: declaracaoId,
          escritorio_id: escritorioId,
          cliente_id: clienteId,
          remetente_tipo: senderType,
          remetente_id: senderId,
          conteudo,
        })
        .select()
        .single();
      if (error) throw error;

      // If sender is contador, fire-and-forget WhatsApp send with retry
      if (senderType === 'contador' && mensagem) {
        sendViaWhatsApp(mensagem.id, clienteId, escritorioId, conteudo).then((result) => {
          if (result && !result.success) {
            toast({
              title: 'Mensagem salva, mas não enviada no WhatsApp',
              description: 'Verifique sua configuração de WhatsApp',
              variant: 'destructive',
            });
          }
        }).catch((err) => {
          console.error('[Chat] WhatsApp fire-and-forget error:', err);
        });
      }

      return mensagem;
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
    return messages.filter(m => m.remetente_tipo === otherType && !m.lida).length;
  }, [messages, senderType]);

  return { messages, isLoading, sendMessage, markRead, unreadCount };
}

/** Fire-and-forget: send message via WhatsApp if addon is active and client has phone */
async function sendViaWhatsApp(messageId: string, clienteId: string, escritorioId: string, conteudo: string) {
  // Check if WhatsApp addon is active
  const { data: addons } = await supabase
    .from('escritorio_addons')
    .select('id, status, addon_id, addons(nome)')
    .eq('escritorio_id', escritorioId)
    .eq('status', 'ativo');

  const hasWhatsApp = addons?.some((a: any) => a.addons?.nome?.toLowerCase().includes('whatsapp'));
  if (!hasWhatsApp) return;

  // Get client phone
  const { data: cliente } = await supabase
    .from('clientes')
    .select('telefone')
    .eq('id', clienteId)
    .single();

  if (!cliente?.telefone) return;

  // Send via edge function (fire-and-forget, don't block UI)
  const { error } = await supabase.functions.invoke('whatsapp-service', {
    body: {
      action: 'send_message',
      to: cliente.telefone,
      message: conteudo,
      escritorio_id: escritorioId,
    },
  });

  if (!error) {
    // Mark as sent via WhatsApp — best effort
    await supabase
      .from('mensagens_chat')
      .update({ enviado_whatsapp: true } as any)
      .eq('id', messageId);
  }
}
