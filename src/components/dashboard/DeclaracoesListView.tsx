import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, MessageSquareText } from 'lucide-react';
import { STATUS_LABELS, formatDate } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
            <TableHead className="hidden md:table-cell">Atualização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            return (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/declaracoes/${item.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{item.clientes?.nome ?? '—'}</span>
                    {item.observacoes_cliente && !item.observacoes_cliente_lida_em && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="warning"
                            className="text-[10px] px-1.5 py-0 gap-1 cursor-help"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MessageSquareText className="h-3 w-3" /> Detalhes
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          O cliente deixou observações. Abra a declaração para ler.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums text-sm text-muted-foreground">{maskCpf(item.clientes?.cpf ?? '')}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                  {item.contador?.nome?.split(' ')[0] ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_COLORS[item.status] || ''}>
                    {STATUS_LABELS[item.status] || item.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {formatDate(item.ultima_atualizacao_status)}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="iconAction" aria-label="Ver declaração" onClick={(e) => { e.stopPropagation(); navigate(`/declaracoes/${item.id}`); }}>
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
