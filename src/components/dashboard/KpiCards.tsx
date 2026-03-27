import { Users, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiData {
  totalClientes: number;
  emAndamento: number;
  docPendente: number;
  transmitidas: number;
}

const kpiConfig = [
  { key: 'totalClientes' as const, label: 'Total de Clientes', icon: Users, color: 'text-accent' },
  { key: 'emAndamento' as const, label: 'Em Andamento', icon: FileText, color: 'text-primary' },
  { key: 'docPendente' as const, label: 'Doc. Pendente', icon: AlertTriangle, color: 'text-warning' },
  { key: 'transmitidas' as const, label: 'Transmitidas', icon: CheckCircle, color: 'text-success' },
];

export function KpiCards({ data, isLoading }: { data?: KpiData; isLoading: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {kpiConfig.map((kpi) => (
        <Card key={kpi.key} className="shadow-sm border-border/50">
          <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5">
            <div className={`p-2 sm:p-3 rounded-xl bg-muted ${kpi.color}`}>
              <kpi.icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{kpi.label}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold font-display tabular-nums">{data?.[kpi.key] ?? 0}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
