import { KanbanCard } from './KanbanCard';
import type { DeclaracaoKanban } from '@/hooks/useDashboardData';
import { Inbox } from 'lucide-react';

interface Props {
  title: string;
  status: string;
  color: string;
  items: DeclaracaoKanban[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, status: string) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
  draggedId: string | null;
  droppedId: string | null;
  isDragOver: boolean;
}

export function KanbanColumn({ title, status, color, items, onDragStart, onDragEnd, onDragOver, onDrop, draggedId, droppedId, isDragOver }: Props) {
  return (
    <div
      className={`
        flex flex-col min-h-[300px] rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        ${isDragOver ? 'ring-2 ring-accent/40 shadow-lg shadow-accent/10 scale-[1.01]' : 'shadow-sm'}
      `}
      onDragOver={(e) => onDragOver(e, status)}
      onDragLeave={() => {}}
      onDrop={(e) => onDrop(e, status)}
    >
      {/* Header */}
      <div
        className={`
          px-4 py-3 transition-colors duration-300
          ${isDragOver ? 'bg-accent/15' : color}
        `}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
          <span
            className={`
              text-xs font-bold tabular-nums rounded-full px-2.5 py-0.5
              transition-all duration-300
              ${isDragOver
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
          ${isDragOver
            ? 'bg-accent/5 border-2 border-dashed border-accent/25'
            : 'bg-muted/20 border-2 border-transparent'
          }
        `}
      >
        {items.length === 0 ? (
          <div className={`
            flex flex-col items-center justify-center py-10 gap-2
            transition-all duration-300
            ${isDragOver ? 'opacity-100 scale-105' : 'opacity-40'}
          `}>
            <Inbox className={`h-8 w-8 transition-colors duration-300 ${isDragOver ? 'text-accent' : 'text-muted-foreground/40'}`} />
            <p className={`text-xs font-medium transition-colors duration-300 ${isDragOver ? 'text-accent' : 'text-muted-foreground/40'}`}>
              {isDragOver ? 'Solte aqui' : 'Nenhuma declaração'}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggedId === item.id}
              isDropped={droppedId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
