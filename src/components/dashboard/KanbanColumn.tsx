import { KanbanCard } from './KanbanCard';
import type { DeclaracaoKanban } from '@/hooks/useDashboardData';

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
      className={`flex flex-col min-h-[280px] rounded-xl overflow-hidden transition-all duration-200 ${isDragOver ? 'ring-2 ring-accent/30 ring-inset' : ''}`}
      onDragOver={(e) => onDragOver(e, status)}
      onDragLeave={() => {}}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className={`px-4 py-2.5 ${isDragOver ? 'bg-accent/15' : color}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <span className="text-xs font-bold tabular-nums text-muted-foreground bg-card/60 rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
      </div>
      <div className={`flex-1 p-2 space-y-2 transition-colors duration-200 ${isDragOver ? 'bg-accent/5' : 'bg-muted/30'}`}>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 text-center py-8">
            Nenhuma declaração
          </p>
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
