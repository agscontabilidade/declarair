import AdminLayout from '@/components/layout/AdminLayout';
import { useAdminMetrics } from '@/hooks/useAdminData';
import { Building2, Users, FileText, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { data: metrics, isLoading } = useAdminMetrics();

  const kpis = [
    { label: 'Escritórios', value: metrics?.totalEscritorios ?? 0, icon: Building2, color: 'text-blue-500' },
    { label: 'Usuários', value: metrics?.totalUsuarios ?? 0, icon: Users, color: 'text-green-500' },
    { label: 'Clientes', value: metrics?.totalClientes ?? 0, icon: Users, color: 'text-purple-500' },
    { label: 'Declarações', value: metrics?.totalDeclaracoes ?? 0, icon: FileText, color: 'text-orange-500' },
    { label: 'Assinaturas Ativas', value: metrics?.assinaturasAtivas ?? 0, icon: CreditCard, color: 'text-cyan-500' },
    { label: 'MRR', value: `R$ ${(metrics?.mrrTotal ?? 0).toFixed(2).replace('.', ',')}`, icon: DollarSign, color: 'text-emerald-500' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Visão geral do sistema</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                {isLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-muted ${kpi.color}`}>
                      <kpi.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{kpi.label}</p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plano breakdown */}
        {metrics?.planos && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                Distribuição por Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(metrics.planos).map(([plano, count]) => (
                  <div key={plano} className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{plano}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
