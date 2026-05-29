import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const DEFAULT_LEMBRETE_WHATSAPP_TEMPLATE =
  `Olá *{nome}*,\n\n` +
  `Lembrete: ainda não recebemos seus documentos para a declaração de IR {ano_base}.\n\n` +
  `📅 *Prazo final:* {prazo}\n\n` +
  `{mensagem_adicional}\n\n` +
  `— {escritorio}`;

export function useLembreteTemplate() {
  const { profile } = useAuth();
  const escritorioId = profile?.escritorioId;
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['lembrete-whatsapp-template', escritorioId],
    enabled: !!escritorioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escritorios')
        .select('lembrete_whatsapp_template')
        .eq('id', escritorioId!)
        .single();
      if (error) throw error;
      return (data?.lembrete_whatsapp_template ?? '') as string;
    },
  });

  const mutation = useMutation({
    mutationFn: async (template: string | null) => {
      if (!escritorioId) throw new Error('Escritório não encontrado');
      const { error } = await supabase
        .from('escritorios')
        .update({ lembrete_whatsapp_template: template })
        .eq('id', escritorioId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lembrete-whatsapp-template', escritorioId] });
      toast({ title: 'Template salvo', description: 'O lembrete WhatsApp foi atualizado.' });
    },
    onError: (e) => {
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      });
    },
  });

  return { template: query.data ?? '', loading: query.isLoading, salvar: mutation };
}
