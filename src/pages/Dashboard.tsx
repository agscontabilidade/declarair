import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, DollarSign, CheckCircle } from 'lucide-react';

const kpis = [
  { label: 'Total de Clientes', value: '0', icon: Users, color: 'text-accent' },
  { label: 'Declarações', value: '0', icon: FileText, color: 'text-primary' },
  { label: 'Transmitidas', value: '0', icon: CheckCircle, color: 'text-success' },
  { label: 'Cobranças Pendentes', value: 'R$ 0,00', icon: DollarSign, color: 'text-warning' },
];

const statusColumns = [
  { key: 'aguardando_documentos', label: 'Aguardando Documentos', color: 'bg-muted' },
  { key: 'documentacao_recebida', label: 'Documentação Recebida', color: 'bg-accent/10' },
  { key: 'declaracao_pronta', label: 'Declaração Pronta', color: 'bg-warning/10' },
  { key: 'transmitida', label: 'Transmitida', color: 'bg-success/10' },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`p-3 rounded-xl bg-muted ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold font-display">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kanban */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-4">Declarações por Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {statusColumns.map((col) => (
              <div key={col.key} className={`rounded-xl p-4 min-h-[200px] ${col.color}`}>
                <h3 className="font-medium text-sm text-muted-foreground mb-3">{col.label}</h3>
                <p className="text-xs text-muted-foreground/60 text-center mt-12">
                  Nenhuma declaração
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
