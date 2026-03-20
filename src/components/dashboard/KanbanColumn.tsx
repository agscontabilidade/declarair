import { KanbanCard } from './KanbanCard';
import type { DeclaracaoKanban } from '@/hooks/useDashboardData';

interface Props {
  title: string;
  status: string;
  color: string;
  items: DeclaracaoKanban[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
}

export function KanbanColumn({ title, status, color, items, onDragStart, onDrop }: Props) {
  return (
    <div
      className="flex flex-col min-h-[280px] rounded-xl overflow-hidden"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className={`px-4 py-2.5 ${color}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <span className="text-xs font-bold tabular-nums text-muted-foreground bg-card/60 rounded-full px-2 py-0.5">
            {items.length}
          </span>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 bg-muted/30">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 text-center py-8">
            Nenhuma declaração
          </p>
        ) : (
          items.map((item) => (
            <KanbanCard key={item.id} item={item} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  );
}
