import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

async function callWhatsApp(action: string, body?: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/whatsapp-service?action=${action}`;

  const res = await fetch(url, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  if (res.status === 401) {
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  if (!res.ok) throw new Error(data.error || 'Erro no WhatsApp');
  return data;
}

export function useWhatsAppStatus() {
  const { profile } = useAuth();
  return useQuery({
    queryKey: ['whatsapp-status', profile.escritorioId],
    queryFn: () => callWhatsApp('status'),
    enabled: !!profile.escritorioId,
    refetchInterval: 15000,
  });
}

export function useCreateInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => callWhatsApp('create-instance', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-status'] });
      toast.success('Instância criada! Escaneie o QR Code.');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useConnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => callWhatsApp('connect', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp-status'] }),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDisconnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => callWhatsApp('disconnect', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-status'] });
      toast.success('WhatsApp desconectado');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => callWhatsApp('delete', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['whatsapp-status'] });
      toast.success('Instância removida');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSendWhatsApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { phone: string; message: string; clienteId?: string; templateId?: string }) =>
      callWhatsApp('send-message', params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mensagens-enviadas'] });
      toast.success('Mensagem enviada via WhatsApp!');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
