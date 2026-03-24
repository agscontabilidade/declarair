import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, FileText } from 'lucide-react';
import { STATUS_LABELS, formatDate } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import type { DeclaracaoKanban } from '@/hooks/useDashboardData';

const STATUS_COLORS: Record<string, string> = {
  aguardando_documentos: 'bg-warning/15 text-warning border-warning/30',
  documentacao_recebida: 'bg-accent/15 text-accent border-accent/30',
  declaracao_pronta: 'bg-success/15 text-success border-success/30',
  transmitida: 'bg-muted text-muted-foreground',
};

function maskCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length < 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

export function DeclaracoesListView({ items, isLoading }: { items: DeclaracaoKanban[]; isLoading: boolean }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground font-medium">Nenhuma declaração neste período</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>Cliente</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead className="hidden md:table-cell">Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Documentos</TableHead>
            <TableHead className="hidden md:table-cell">Atualização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const totalDocs = item.totalDocs || 0;
            const receivedDocs = totalDocs - (item.pendingDocs || 0);
            const docPct = totalDocs > 0 ? Math.round((receivedDocs / totalDocs) * 100) : 0;
            return (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/declaracoes/${item.id}`)}
              >
                <TableCell className="font-medium">{item.clientes?.nome ?? '—'}</TableCell>
                <TableCell className="tabular-nums text-sm text-muted-foreground">{maskCpf(item.clientes?.cpf ?? '')}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {item.contador?.nome?.split(' ')[0] ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_COLORS[item.status] || ''}>
                    {STATUS_LABELS[item.status] || item.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {totalDocs > 0 ? (
                    <div className="flex items-center gap-2">
                      <Progress value={docPct} className="h-1.5 w-16" />
                      <span className="text-xs text-muted-foreground tabular-nums">{receivedDocs}/{totalDocs}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {formatDate(item.ultima_atualizacao_status)}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/declaracoes/${item.id}`); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
