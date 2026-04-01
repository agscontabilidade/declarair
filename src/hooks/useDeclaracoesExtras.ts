import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export function useDeclaracoesExtras() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const comprarDeclaracao = useMutation({
    mutationFn: async (quantidade: number = 1) => {
      if (!profile.escritorioId) throw new Error('Sem escritório');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Não autenticado');

      const url = `https://${PROJECT_ID}.supabase.co/functions/v1/billing-service?action=buy-extra-declaracoes`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ quantidade }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar cobrança');

      return { ...data, quantidade };
    },
    onSuccess: (data, quantidade) => {
      if (data.clientSecret) {
        // Redirect to checkout with client secret for payment
        toast.success(`Pagamento de ${quantidade} declaração(ões) preparado!`, {
          description: 'Complete o pagamento para ativar.',
        });
      } else {
        toast.success(`${quantidade} declaração(ões) extra(s) adicionadas!`);
      }
      queryClient.invalidateQueries({ queryKey: ['escritorio-billing'] });
      queryClient.invalidateQueries({ queryKey: ['usage-status'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao comprar declaração', { description: error.message });
    },
  });

  return { comprarDeclaracao };
}
