import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import type { DeclaracaoKanban } from '@/hooks/useDashboardData';
import { Inbox, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const COLUMN_TOOLTIPS: Record<string, string> = {
  aguardando_documentos: 'Cliente ainda precisa enviar os documentos. A bola está com ele.',
  documentacao_recebida: 'Documentos chegaram. Agora é com o contador montar a declaração.',
  declaracao_pronta: 'Declaração finalizada, aguardando transmissão à Receita Federal.',
  transmitida: 'Declarações já enviadas à Receita. Etapa concluída.',
};

interface Props {
  title: string;
  status: string;
  color: string;
  items: DeclaracaoKanban[];
  isAnyDragging?: boolean;
}

export function KanbanColumn({ title, status, color, items, isAnyDragging }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { status },
  });

  const tooltipText = COLUMN_TOOLTIPS[status];

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col min-h-[300px] rounded-xl
        transition-shadow duration-200 ease-out
        ${isOver ? 'ring-2 ring-accent/40 shadow-lg shadow-accent/10' : 'shadow-sm'}
      `}
    >
      {/* Header */}
      <div
        className={`
          px-4 py-3 rounded-t-xl transition-colors duration-200
          ${isOver ? 'bg-accent/15' : color}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
            {tooltipText && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                    {tooltipText}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <span
            className={`
              text-xs font-bold tabular-nums rounded-full px-2.5 py-0.5
              transition-colors duration-200
              ${isOver
                ? 'bg-accent/20 text-accent'
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
          flex-1 p-2.5 space-y-2.5 rounded-b-xl
          transition-colors duration-200 ease-out
          border-2
          ${isOver
            ? 'bg-accent/5 border-dashed border-accent/25'
            : 'bg-muted/20 border-transparent'
          }
        `}
      >
        {items.length === 0 ? (
          <div className={`
            flex flex-col items-center justify-center py-10 gap-2
            transition-opacity duration-200
            ${isOver ? 'opacity-100' : 'opacity-40'}
          `}>
            <Inbox className={`h-8 w-8 transition-colors duration-200 ${isOver ? 'text-accent' : 'text-muted-foreground/40'}`} />
            <p className={`text-xs font-medium transition-colors duration-200 ${isOver ? 'text-accent' : 'text-muted-foreground/40'}`}>
              {isOver ? 'Solte aqui' : 'Nenhuma declaração'}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              isAnyDragging={isAnyDragging}
            />
          ))
        )}
      </div>
    </div>
  );
}

