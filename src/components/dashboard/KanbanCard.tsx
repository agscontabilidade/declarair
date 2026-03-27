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

  return (
    <div
      draggable
      onDragStart={(e) => {
        // Set a minimal drag image to avoid the default ghost
        const el = e.currentTarget;
        const clone = el.cloneNode(true) as HTMLElement;
        clone.style.width = `${el.offsetWidth}px`;
        clone.style.position = 'absolute';
        clone.style.top = '-9999px';
        clone.style.opacity = '0.85';
        clone.style.transform = 'rotate(2deg) scale(1.02)';
        clone.style.boxShadow = '0 20px 40px -8px rgba(0,0,0,0.2)';
        clone.style.borderRadius = '12px';
        document.body.appendChild(clone);
        e.dataTransfer.setDragImage(clone, el.offsetWidth / 2, 24);
        requestAnimationFrame(() => document.body.removeChild(clone));
        onDragStart(e, item.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`/declaracoes/${item.id}`)}
      style={{
        opacity: isDragging ? 0.35 : 1,
        transform: isDragging
          ? 'scale(0.96)'
          : isDropped
            ? 'scale(1)'
            : 'scale(1)',
        transition: 'opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
      }}
      className={`
        group bg-card rounded-xl p-3.5 shadow-sm border border-border/40
        cursor-grab active:cursor-grabbing
        hover:shadow-lg hover:border-accent/30 hover:-translate-y-0.5
        ${isDropped ? 'animate-kanban-land' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
          {getInitials(nome)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate group-hover:text-accent transition-colors duration-200">{nome}</p>
          <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{maskCpf(cpf)}</p>
        </div>
        {stale && (
          <div className="relative">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5 animate-pulse" />
          </div>
        )}
      </div>

      {totalDocs > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <Progress value={docPct} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap font-medium">
            {receivedDocs}/{totalDocs}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-2.5">
        {item.contador && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
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
