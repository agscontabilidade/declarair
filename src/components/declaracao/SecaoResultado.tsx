import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Copy, Activity, FileText, Info, MinusCircle, Clock, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  declaracao: {
    id?: string;
    tipo_resultado?: string | null;
    valor_resultado?: number | string | null;
    numero_recibo?: string | null;
    status?: string | null;
    status_processamento_rfb?: string | null;
    em_processamento?: boolean | null;
    arquivo_declaracao_url?: string | null;
    arquivo_recibo_url?: string | null;
  } | null | undefined;
}

const TIPO_LABEL: Record<string, string> = {
  restituicao: 'Restituição',
  pagamento: 'Imposto a pagar',
  nenhum: 'Sem imposto',
};

export function SecaoResultado({ declaracao }: Props) {
  const tipoResultado = declaracao?.tipo_resultado || '';
  const valorResultado = declaracao?.valor_resultado != null ? Number(declaracao.valor_resultado) : null;
  const numeroRecibo = declaracao?.numero_recibo || '';
  const temDeclaracao = !!declaracao?.arquivo_declaracao_url;
  const temRecibo = !!declaracao?.arquivo_recibo_url;
  const temDados = !!tipoResultado || valorResultado != null || !!numeroRecibo;

  const handleCopyRecibo = () => {
    if (!numeroRecibo) return;
    navigator.clipboard.writeText(numeroRecibo);
    toast.success('Número do recibo copiado!');
  };

  const valorColor =
    tipoResultado === 'restituicao'
      ? 'text-emerald-600'
      : tipoResultado === 'pagamento'
        ? 'text-red-600'
        : 'text-muted-foreground';

  const TipoIcon =
    tipoResultado === 'restituicao' ? TrendingUp : tipoResultado === 'pagamento' ? TrendingDown : MinusCircle;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Resultado da Declaração</CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            Extraído automaticamente do PDF anexado
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!temDados ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2 border border-dashed rounded-lg bg-muted/20">
            <FileText className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground max-w-md">
              {temDeclaracao || temRecibo
                ? 'Aguardando processamento dos arquivos pela IA…'
                : 'Anexe o PDF da declaração e do recibo na aba Documentos. O resultado aparecerá aqui automaticamente.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Tipo</p>
              <div className="flex items-center gap-2 h-9">
                <TipoIcon className={`h-4 w-4 ${valorColor}`} />
                <span className="font-semibold">{TIPO_LABEL[tipoResultado] || '—'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Valor</p>
              <p className={`text-xl font-bold h-9 flex items-center ${valorColor}`}>
                {valorResultado != null && tipoResultado !== 'nenhum' ? formatCurrency(valorResultado) : '—'}
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Número do Recibo</p>
              {numeroRecibo ? (
                <button
                  onClick={handleCopyRecibo}
                  className="flex items-center gap-2 h-9 text-sm font-medium font-mono hover:text-primary transition-colors group"
                >
                  <span className="truncate">{numeroRecibo}</span>
                  <Copy className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 shrink-0" />
                </button>
              ) : (
                <p className="text-sm text-muted-foreground h-9 flex items-center">— pendente —</p>
              )}
            </div>
          </div>
        )}

        {declaracao?.id && (() => {
          const PROC_META = {
            aguardando: { label: 'Aguardando processamento', cls: 'border-slate-300 text-slate-700 bg-slate-50', icon: Clock, descricao: 'Ainda não há retorno da Receita Federal' },
            processada: { label: 'Processada sem erros', cls: 'border-emerald-300 text-emerald-700 bg-emerald-50', icon: CheckCircle2, descricao: 'Recebida e processada normalmente pela Receita' },
            pendencias: { label: 'Com pendências', cls: 'border-amber-300 text-amber-700 bg-amber-50', icon: AlertTriangle, descricao: 'A Receita identificou pendências a corrigir' },
            malha_fina: { label: 'Em malha fina', cls: 'border-red-300 text-red-700 bg-red-50', icon: ShieldAlert, descricao: 'Declaração retida em malha fiscal' },
          } as const;
          const key = (declaracao.status_processamento_rfb as keyof typeof PROC_META) || 'aguardando';
          const meta = PROC_META[key] || PROC_META.aguardando;
          const PIcon = meta.icon;
          return (
            <>
              <Separator className="my-1" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Processamento na Receita Federal</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${meta.cls}`}>
                    <PIcon className="h-3.5 w-3.5" />
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {meta.descricao} — atualiza em tempo real quando o status mudar.
                  </span>
                </div>
              </div>
            </>
          );
        })()}

        {(temDeclaracao || temRecibo) && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {temDeclaracao && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <FileText className="h-3 w-3" /> Declaração anexada
              </Badge>
            )}
            {temRecibo && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <FileText className="h-3 w-3" /> Recibo anexado
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
