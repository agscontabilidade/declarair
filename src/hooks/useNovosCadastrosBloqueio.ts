import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Bloqueio de envio de novos documentos pelo portal do CLIENTE.
 * Não afeta contador/colaborador nem service_role.
 * A chave `cliente_upload_bloqueado` em system_configs controla tudo.
 */
export interface ClienteUploadBloqueio {
  enabled: boolean;
  deadline: string | null;
  mensagem: string;
  /** true se enabled=true e now >= deadline */
  bloqueado: boolean;
}

const FALLBACK_MSG =
  'O envio de novos documentos pelo portal foi encerrado. Entre em contato com seu contador para tratar qualquer pendência.';

export function useClienteUploadBloqueio() {
  const query = useQuery({
    queryKey: ['cliente-upload-bloqueio'],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<ClienteUploadBloqueio> => {
      const { data, error } = await supabase.rpc('get_novos_cadastros_bloqueio');
      if (error) {
        return { enabled: false, deadline: null, mensagem: FALLBACK_MSG, bloqueado: false };
      }
      const raw = (data ?? {}) as Record<string, unknown>;
      const enabled = Boolean(raw.enabled);
      const deadline = typeof raw.deadline === 'string' ? raw.deadline : null;
      const mensagem = typeof raw.mensagem === 'string' && raw.mensagem
        ? raw.mensagem
        : FALLBACK_MSG;
      const bloqueado = enabled && !!deadline && new Date(deadline).getTime() <= Date.now();
      return { enabled, deadline, mensagem, bloqueado };
    },
  });

  return {
    bloqueado: query.data?.bloqueado ?? false,
    mensagem: query.data?.mensagem ?? FALLBACK_MSG,
    deadline: query.data?.deadline ?? null,
    enabled: query.data?.enabled ?? false,
    isLoading: query.isLoading,
  };
}

/** @deprecated mantido para compatibilidade — use useClienteUploadBloqueio */
export const useNovosCadastrosBloqueio = useClienteUploadBloqueio;
