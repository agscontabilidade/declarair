import { memo } from 'react';
import { Users, FileText, Inbox, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface KpiData {
  totalClientes: number;
  emAndamento: number;
  docPendente: number;
  transmitidas: number;
}

const kpiConfig = [
  {
    key: 'totalClientes' as const,
    label: 'Total de Clientes',
    icon: Users,
    color: 'text-accent',
    tooltip: 'Quantidade total de clientes ativos cadastrados no seu escritório.',
  },
  {
    key: 'emAndamento' as const,
    label: 'Em Andamento',
    icon: FileText,
    color: 'text-primary',
    tooltip: 'Declarações que ainda não foram transmitidas — ou seja, estão em qualquer etapa do funil (aguardando documentos, documentação recebida ou pronta para envio).',
  },
  {
    key: 'docPendente' as const,
    label: 'Aguardando Docs',
    icon: Inbox,
    color: 'text-warning',
    tooltip: 'Declarações que estão na primeira etapa do funil, esperando o cliente enviar os documentos necessários.',
  },
  {
    key: 'transmitidas' as const,
    label: 'Transmitidas',
    icon: CheckCircle,
    color: 'text-success',
    tooltip: 'Declarações já enviadas à Receita Federal neste ano-base. Etapa final do funil.',
  },
];

export const KpiCards = memo(function KpiCards({ data, isLoading }: { data?: KpiData; isLoading: boolean }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiConfig.map((kpi) => (
          <Tooltip key={kpi.key}>
            <TooltipTrigger asChild>
              <Card className="shadow-sm border-border/50 cursor-help transition-all hover:shadow-md hover:border-border">
                <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5">
                  <div className={`p-2 sm:p-3 rounded-xl bg-muted ${kpi.color}`}>
                    <kpi.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{kpi.label}</p>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-xl sm:text-2xl font-bold font-display tabular-nums">{data?.[kpi.key] ?? 0}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-relaxed">
              {kpi.tooltip}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
});
