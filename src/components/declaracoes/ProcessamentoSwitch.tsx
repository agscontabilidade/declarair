import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Clock, CheckCircle2, AlertTriangle, ShieldAlert, ChevronDown, Loader2 } from 'lucide-react';

export type StatusProcessamentoRfb = 'aguardando' | 'processada' | 'pendencias' | 'malha_fina';

interface Props {
  declaracaoId: string;
  status: StatusProcessamentoRfb;
}

const META: Record<
  StatusProcessamentoRfb,
  { label: string; short: string; cls: string; icon: typeof Clock; descricao: string }
> = {
  aguardando: {
    label: 'Aguardando processamento',
    short: 'Aguardando',
    cls: 'border-slate-300 text-slate-700 bg-slate-50',
    icon: Clock,
    descricao: 'Ainda não há retorno da Receita Federal',
  },
  processada: {
    label: 'Processada sem erros',
    short: 'Processada',
    cls: 'border-emerald-300 text-emerald-700 bg-emerald-50',
    icon: CheckCircle2,
    descricao: 'Recebida e processada normalmente pela Receita',
  },
  pendencias: {
    label: 'Com pendências',
    short: 'Pendências',
    cls: 'border-amber-300 text-amber-700 bg-amber-50',
    icon: AlertTriangle,
    descricao: 'A Receita identificou pendências que precisam ser corrigidas',
  },
  malha_fina: {
    label: 'Em malha fina',
    short: 'Malha fina',
    cls: 'border-red-300 text-red-700 bg-red-50',
    icon: ShieldAlert,
    descricao: 'Declaração retida em malha fiscal',
  },
};

const ORDEM: StatusProcessamentoRfb[] = ['aguardando', 'processada', 'pendencias', 'malha_fina'];

export function ProcessamentoSwitch({ declaracaoId, status }: Props) {
  const queryClient = useQueryClient();
  const atual = META[status] || META.aguardando;
  const Icon = atual.icon;

  const mutate = useMutation({
    mutationFn: async (next: StatusProcessamentoRfb) => {
      const { error } = await supabase
        .from('declaracoes')
        .update({ status_processamento_rfb: next, em_processamento: next === 'processada' })
        .eq('id', declaracaoId);
      if (error) throw error;
      return next;
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['declaracoes-lista'] });
      const prev = queryClient.getQueriesData({ queryKey: ['declaracoes-lista'] });
      queryClient.setQueriesData({ queryKey: ['declaracoes-lista'] }, (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return (old as { id: string }[]).map((d) =>
          d.id === declaracaoId ? { ...d, status_processamento_rfb: next, em_processamento: next === 'processada' } : d,
        );
      });
      return { prev };
    },
    onError: (_e, _v, ctx: any) => {
      const c = ctx as { prev?: Array<[unknown, unknown]> } | undefined;
      c?.prev?.forEach(([key, val]) => queryClient.setQueryData(key as readonly unknown[], val));
      toast.error('Erro ao atualizar processamento');
    },
    onSuccess: (next) => {
      toast.success(`Processamento: ${META[next].label.toLowerCase()}`);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] }),
  });

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={mutate.isPending}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition hover:opacity-80 disabled:opacity-50 ${atual.cls}`}
            title={atual.descricao}
          >
            {mutate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
            <span>{atual.short}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs">Status na Receita Federal</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ORDEM.map((s) => {
            const m = META[s];
            const SIcon = m.icon;
            const ativo = s === status;
            return (
              <DropdownMenuItem
                key={s}
                onClick={() => !ativo && mutate.mutate(s)}
                className="flex items-start gap-2 py-2 cursor-pointer"
              >
                <SIcon className={`h-4 w-4 mt-0.5 shrink-0 ${m.cls.split(' ').find((c) => c.startsWith('text-')) || ''}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{m.label}</span>
                    {ativo && <Badge variant="outline" className="text-[9px] py-0 px-1.5">atual</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{m.descricao}</p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
