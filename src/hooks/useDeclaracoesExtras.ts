import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PRECOS } from '@/lib/constants/planos';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export function useDeclaracoesExtras() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const comprarDeclaracao = useMutation({
    mutationFn: async (quantidade: number = 1) => {
      if (!profile.escritorioId) throw new Error('Sem escritório');

      const valorTotal = quantidade * PRECOS.DECLARACAO_EXTRA;

      // Criar cobrança via billing-service
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const url = `https://${PROJECT_ID}.supabase.co/functions/v1/billing-service?action=create-payment`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          descricao: `${quantidade} declaração(ões) extra(s)`,
          valor: valorTotal,
          tipo: 'declaracao_extra',
        }),
      });

      const cobranca = await res.json();
      if (!res.ok) throw new Error(cobranca.error || 'Erro ao gerar cobrança');

      return { cobranca, quantidade };
    },
    onSuccess: (_data, quantidade) => {
      toast.success(`${quantidade} declaração(ões) extra(s) solicitada(s)!`, {
        description: 'O boleto/pix foi gerado. Verifique suas cobranças.',
      });
      queryClient.invalidateQueries({ queryKey: ['escritorio-billing'] });
      queryClient.invalidateQueries({ queryKey: ['usage-status'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao comprar declaração', { description: error.message });
    },
  });

  return { comprarDeclaracao };
}
