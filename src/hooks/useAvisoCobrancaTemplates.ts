import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const DEFAULT_AVISO_COBRANCA_WHATSAPP_TEMPLATE =
  `Olá *{nome}*,\n\n` +
  `Lembrete sobre a cobrança *{descricao}*:\n\n` +
  `💰 *Valor:* R$ {valor}\n` +
  `📅 *Vencimento:* {vencimento}\n` +
  `{linha_atraso}\n\n` +
  `{mensagem_adicional}\n\n` +
  `— {escritorio}`;

export const DEFAULT_AVISO_COBRANCA_EMAIL_ASSUNTO =
  `Lembrete de cobrança — R$ {valor} (venc. {vencimento})`;

export const DEFAULT_AVISO_COBRANCA_EMAIL_CORPO =
  `Olá {nome},\n\n` +
  `Este é um lembrete sobre a cobrança *{descricao}* no valor de R$ {valor}, com vencimento em {vencimento}.\n\n` +
  `{mensagem_adicional}\n\n` +
  `Caso o pagamento já tenha sido efetuado, desconsidere este aviso.\n\n` +
  `— {escritorio}`;

interface AvisoTemplates {
  whatsapp: string;
  emailAssunto: string;
  emailCorpo: string;
}

export function useAvisoCobrancaTemplates() {
  const { profile } = useAuth();
  const escritorioId = profile?.escritorioId;
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['aviso-cobranca-templates', escritorioId],
    enabled: !!escritorioId,
    queryFn: async (): Promise<AvisoTemplates> => {
      const { data, error } = await supabase
        .from('escritorios')
        .select('cobranca_aviso_whatsapp_template, cobranca_aviso_email_assunto, cobranca_aviso_email_corpo')
        .eq('id', escritorioId!)
        .single();
      if (error) throw error;
      return {
        whatsapp: (data?.cobranca_aviso_whatsapp_template ?? '') as string,
        emailAssunto: (data?.cobranca_aviso_email_assunto ?? '') as string,
        emailCorpo: (data?.cobranca_aviso_email_corpo ?? '') as string,
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async (input: Partial<AvisoTemplates>) => {
      if (!escritorioId) throw new Error('Escritório não encontrado');
      const patch: Record<string, string | null> = {};
      if (input.whatsapp !== undefined) patch.cobranca_aviso_whatsapp_template = input.whatsapp.trim() ? input.whatsapp : null;
      if (input.emailAssunto !== undefined) patch.cobranca_aviso_email_assunto = input.emailAssunto.trim() ? input.emailAssunto : null;
      if (input.emailCorpo !== undefined) patch.cobranca_aviso_email_corpo = input.emailCorpo.trim() ? input.emailCorpo : null;
      const { error } = await supabase.from('escritorios').update(patch).eq('id', escritorioId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aviso-cobranca-templates', escritorioId] });
      toast({ title: 'Template salvo', description: 'Os avisos de cobrança foram atualizados.' });
    },
    onError: (e) => {
      toast({
        title: 'Erro ao salvar',
        description: e instanceof Error ? e.message : 'Tente novamente',
        variant: 'destructive',
      });
    },
  });

  return {
    templates: query.data ?? { whatsapp: '', emailAssunto: '', emailCorpo: '' },
    loading: query.isLoading,
    salvar: mutation,
  };
}
