import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import type { DeclaracaoKanban } from '@/hooks/useDashboardData';
import { Inbox } from 'lucide-react';

interface Props {
  title: string;
  status: string;
  color: string;
  items: DeclaracaoKanban[];
}

export function KanbanColumn({ title, status, color, items }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-h-[300px] rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        ${isOver ? 'ring-2 ring-accent/40 shadow-lg shadow-accent/10 scale-[1.01]' : 'shadow-sm'}
      `}
    >
      {/* Header */}
      <div
        className={`
          px-4 py-3 transition-colors duration-300
          ${isOver ? 'bg-accent/15' : color}
        `}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
          <span
            className={`
              text-xs font-bold tabular-nums rounded-full px-2.5 py-0.5
              transition-all duration-300
              ${isOver
                ? 'bg-accent/20 text-accent scale-110'
                : 'bg-card/70 text-muted-foreground'
              }
            `}
          >
            {items.length}
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        className={`
          flex-1 p-2.5 space-y-2.5 transition-all duration-300 ease-out
          ${isOver
            ? 'bg-accent/5 border-2 border-dashed border-accent/25'
            : 'bg-muted/20 border-2 border-transparent'
          }
        `}
      >
        {items.length === 0 ? (
          <div className={`
            flex flex-col items-center justify-center py-10 gap-2
            transition-all duration-300
            ${isOver ? 'opacity-100 scale-105' : 'opacity-40'}
          `}>
            <Inbox className={`h-8 w-8 transition-colors duration-300 ${isOver ? 'text-accent' : 'text-muted-foreground/40'}`} />
            <p className={`text-xs font-medium transition-colors duration-300 ${isOver ? 'text-accent' : 'text-muted-foreground/40'}`}>
              {isOver ? 'Solte aqui' : 'Nenhuma declaração'}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
            />
          ))
        )}
      </div>
    </div>
  );
}
