import AdminLayout from '@/components/layout/AdminLayout';
import { useAdminAssinaturas } from '@/hooks/useAdminData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Ativa', variant: 'default' },
  canceled: { label: 'Cancelada', variant: 'destructive' },
  past_due: { label: 'Em atraso', variant: 'destructive' },
  trialing: { label: 'Trial', variant: 'outline' },
};

export default function AdminAssinaturas() {
  const { data: assinaturas, isLoading } = useAdminAssinaturas();
  const [search, setSearch] = useState('');

  const filtered = (assinaturas ?? []).filter(a =>
    ((a as any).escritorios?.nome ?? '').toLowerCase().includes(search.toLowerCase()) ||
    a.plano.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assinaturas</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length} assinatura(s)</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por escritório ou plano..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escritório</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Próx. Cobrança</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const st = statusMap[a.status] ?? { label: a.status, variant: 'secondary' as const };
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          {(a as any).escritorios?.nome ?? '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{a.plano}</Badge>
                      </TableCell>
                      <TableCell>R$ {Number(a.valor).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">{a.ciclo.toLowerCase()}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">{a.provider ?? 'stripe'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.proxima_cobranca ? format(new Date(a.proxima_cobranca), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma assinatura encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
