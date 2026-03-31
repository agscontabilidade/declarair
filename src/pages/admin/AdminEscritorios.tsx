import AdminLayout from '@/components/layout/AdminLayout';
import { useAdminEscritorios } from '@/hooks/useAdminData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminEscritorios() {
  const { data: escritorios, isLoading } = useAdminEscritorios();
  const [search, setSearch] = useState('');

  const filtered = (escritorios ?? []).filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    (e.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (e.cnpj ?? '').includes(search)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Escritórios</h1>
            <p className="text-muted-foreground text-sm mt-1">{filtered.length} escritório(s)</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar escritório..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Declarações</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((esc) => (
                  <TableRow key={esc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {esc.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={esc.plano === 'pro' ? 'default' : 'secondary'} className="capitalize">
                        {esc.plano ?? 'gratuito'}
                      </Badge>
                    </TableCell>
                    <TableCell>{esc.declaracoes_utilizadas ?? 0}/{esc.limite_declaracoes ?? 1}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{esc.cnpj ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{esc.email ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(esc.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum escritório encontrado
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
