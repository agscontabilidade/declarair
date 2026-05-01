import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

interface Props {
  declaracaoId: string | null;
  escritorioId: string | null;
  clienteNome?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ObservacoesModal({ declaracaoId, escritorioId, clienteNome, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [conteudo, setConteudo] = useState('');

  const { data: nota, isLoading } = useQuery({
    queryKey: ['declaracao-nota', declaracaoId],
    queryFn: async () => {
      if (!declaracaoId) return null;
      const { data, error } = await supabase
        .from('declaracao_notas_internas')
        .select('id, conteudo')
        .eq('declaracao_id', declaracaoId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!declaracaoId && open,
  });

  useEffect(() => {
    setConteudo(nota?.conteudo ?? '');
  }, [nota, open]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!declaracaoId || !escritorioId) throw new Error('IDs ausentes');
      const { error } = await supabase
        .from('declaracao_notas_internas')
        .upsert(
          { declaracao_id: declaracaoId, escritorio_id: escritorioId, conteudo, updated_at: new Date().toISOString() },
          { onConflict: 'declaracao_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Observações salvas');
      queryClient.invalidateQueries({ queryKey: ['declaracao-nota', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] });
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Erro ao salvar')),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Observações internas</DialogTitle>
          <DialogDescription>
            {clienteNome ? `Anotações sobre a declaração de ${clienteNome}` : 'Anotações internas (não visíveis ao cliente)'}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <Textarea
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Escreva uma observação interna..."
            className="min-h-[160px]"
          />
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
            {salvar.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
