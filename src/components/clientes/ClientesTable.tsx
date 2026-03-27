import { Eye, MessageCircle, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCPF } from '@/lib/formatters';

interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  email: string | null;
  telefone: string | null;
  status_onboarding: string;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  nao_iniciado: { label: 'Não Iniciado', variant: 'secondary' },
  convite_enviado: { label: 'Convite Enviado', variant: 'outline' },
  em_andamento: { label: 'Em Andamento', variant: 'default' },
  concluido: { label: 'Concluído', variant: 'default' },
};

function formatTelefone(tel: string | null) {
  if (!tel) return '—';
  const d = tel.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
}

export function ClientesTable({ clientes, isLoading }: { clientes: Cliente[]; isLoading: boolean }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground font-medium">Nenhum cliente encontrado</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Adicione seu primeiro cliente para começar</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden sm:border sm:rounded-lg">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>CPF</TableHead>
          <TableHead className="hidden md:table-cell">Email</TableHead>
          <TableHead className="hidden md:table-cell">Telefone</TableHead>
          <TableHead>Onboarding</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((c) => {
          const st = statusMap[c.status_onboarding] ?? statusMap.nao_iniciado;
          const tel = c.telefone?.replace(/\D/g, '');
          return (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.nome}</TableCell>
              <TableCell className="tabular-nums">{formatCPF(c.cpf)}</TableCell>
              <TableCell className="hidden md:table-cell">{c.email ?? '—'}</TableCell>
              <TableCell className="hidden md:table-cell tabular-nums">{formatTelefone(c.telefone)}</TableCell>
              <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button size="icon" variant="ghost" onClick={() => navigate(`/clientes/${c.id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {tel && (
                    <Button size="icon" variant="ghost" asChild>
                      <a href={`https://wa.me/55${tel}`} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => navigate('/cobrancas')}>
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
        </div>
      </div>
    </div>
  );
}
