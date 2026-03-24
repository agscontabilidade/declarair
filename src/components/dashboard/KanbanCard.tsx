import { useNavigate } from 'react-router-dom';
import { AlertTriangle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { DeclaracaoKanban } from '@/hooks/useDashboardData';

function maskCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length < 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function isStale(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  return diff > 7 * 24 * 60 * 60 * 1000;
}

interface Props {
  item: DeclaracaoKanban;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDropped: boolean;
}

export function KanbanCard({ item, onDragStart, onDragEnd, isDragging, isDropped }: Props) {
  const navigate = useNavigate();
  const nome = item.clientes?.nome ?? 'Cliente';
  const cpf = item.clientes?.cpf ?? '';
  const stale = isStale(item.ultima_atualizacao_status);
  const totalDocs = item.totalDocs || 0;
  const receivedDocs = totalDocs - (item.pendingDocs || 0);
  const docPct = totalDocs > 0 ? Math.round((receivedDocs / totalDocs) * 100) : 0;

  const animationClass = isDropped ? 'animate-card-drop' : '';
  const dragClass = isDragging ? 'opacity-50 scale-95' : '';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`/declaracoes/${item.id}`)}
      className={`bg-card rounded-lg p-3 md:p-3.5 shadow-sm border border-border/50 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ${animationClass} ${dragClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
          {getInitials(nome)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{nome}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{maskCpf(cpf)}</p>
        </div>
        {stale && (
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        )}
      </div>

      {/* Doc progress bar */}
      {totalDocs > 0 && (
        <div className="mt-2.5 flex items-center gap-2">
          <Progress value={docPct} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
            {receivedDocs}/{totalDocs}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-2">
        {item.contador && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {item.contador.nome.split(' ')[0]}
          </Badge>
        )}
        {item.pendingDocs > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <FileText className="h-3 w-3" />
            {item.pendingDocs} pendente{item.pendingDocs > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
