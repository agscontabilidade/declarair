import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle, MessageSquareText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { STATUS_LABELS, formatDate } from '@/lib/formatters';
import type { DeclaracaoKanban } from '@/hooks/useDashboardData';

function maskCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length < 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function diasDesde(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Status that represent "ball is in the accountant's court" — staleness is meaningful here
const STALE_RELEVANT_STATUSES = new Set(['documentacao_recebida', 'declaracao_pronta']);

const STATUS_TOOLTIPS: Record<string, string> = {
  aguardando_documentos: 'Esperando o cliente enviar os documentos.',
  documentacao_recebida: 'Documentos recebidos. Hora do contador iniciar a declaração.',
  declaracao_pronta: 'Declaração finalizada. Pronta para ser transmitida à Receita.',
  transmitida: 'Declaração já enviada à Receita Federal.',
};

interface Props {
  item: DeclaracaoKanban;
  isOverlay?: boolean;
  isAnyDragging?: boolean;
}

export const KanbanCard = memo(function KanbanCard({ item, isOverlay, isAnyDragging }: Props) {
  const navigate = useNavigate();
  const nome = item.clientes?.nome ?? 'Cliente';
  const cpf = item.clientes?.cpf ?? '';
  const dias = diasDesde(item.ultima_atualizacao_status);
  const stale = dias > 7 && STALE_RELEVANT_STATUSES.has(item.status);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: item.id,
    data: { item },
    disabled: !!isOverlay,
  });

  const style = {
    transform: isOverlay
      ? `${CSS.Transform.toString(transform) ?? ''} translateZ(0)`.trim()
      : CSS.Transform.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    transition: isDragging ? undefined : 'transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
    willChange: 'transform' as const,
    backfaceVisibility: 'hidden' as const,
    WebkitFontSmoothing: 'antialiased' as const,
  };

  const statusLabel = STATUS_LABELS[item.status] || item.status;
  const statusTooltip = STATUS_TOOLTIPS[item.status] || '';

  const cardContent = (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) navigate(`/declaracoes/${item.id}`);
      }}
      className={`
        group bg-card rounded-xl p-3.5 shadow-sm border border-border/40
        cursor-grab active:cursor-grabbing
        hover:shadow-lg hover:border-accent/30 hover:-translate-y-0.5
        ${isOverlay ? 'shadow-2xl rotate-2 scale-105 ring-2 ring-accent/30' : ''}
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
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle
                className="h-4 w-4 text-warning shrink-0 mt-0.5 animate-pulse cursor-help"
                onClick={(e) => e.stopPropagation()}
              />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs text-xs leading-relaxed">
              Parado há {dias} dias sem mudança de status. Está com você — pode dar continuidade.
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {(item.contador || (item.observacoes_cliente && !item.observacoes_cliente_lida_em)) && (
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
          {item.contador && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
              {item.contador.nome.split(' ')[0]}
            </Badge>
          )}
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
                O cliente deixou observações para você. Abra a declaração para ler.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip open={isOverlay || isDragging ? false : undefined}>
        <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
        <TooltipContent side="right" align="start" className="max-w-xs text-xs leading-relaxed">
          <div className="space-y-1">
            <p className="font-semibold">{statusLabel}</p>
            {statusTooltip && <p className="text-muted-foreground">{statusTooltip}</p>}
            <p className="text-muted-foreground pt-1 border-t border-border/40">
              Última atualização: {formatDate(item.ultima_atualizacao_status)}
              {dias > 0 && ` (há ${dias} ${dias === 1 ? 'dia' : 'dias'})`}
            </p>
            <p className="text-muted-foreground italic pt-0.5">Clique para abrir · Arraste para mudar de status</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
