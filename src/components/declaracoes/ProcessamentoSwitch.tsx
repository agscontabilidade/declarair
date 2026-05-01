import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  declaracaoId: string;
  emProcessamento: boolean;
}

export function ProcessamentoSwitch({ declaracaoId, emProcessamento }: Props) {
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: async (next: boolean) => {
      const { error } = await supabase
        .from('declaracoes')
        .update({ em_processamento: next })
        .eq('id', declaracaoId);
      if (error) throw error;
      return next;
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['declaracoes-lista'] });
      const prev = queryClient.getQueriesData({ queryKey: ['declaracoes-lista'] });
      queryClient.setQueriesData({ queryKey: ['declaracoes-lista'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((d: any) => (d.id === declaracaoId ? { ...d, em_processamento: next } : d));
      });
      return { prev };
    },
    onError: (_e, _v, ctx: any) => {
      ctx?.prev?.forEach(([key, val]: any) => queryClient.setQueryData(key, val));
      toast.error('Erro ao atualizar');
    },
    onSuccess: (next) => {
      toast.success(next ? 'Marcada como em processamento' : 'Processamento concluído');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] }),
  });

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Switch checked={emProcessamento} onCheckedChange={(v) => toggle.mutate(v)} disabled={toggle.isPending} />
      {emProcessamento && (
        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
          Em processamento
        </Badge>
      )}
    </div>
  );
}
