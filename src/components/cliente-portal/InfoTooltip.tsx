import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Side = 'top' | 'right' | 'bottom' | 'left';

interface Props {
  children: React.ReactNode;
  side?: Side;
  className?: string;
  iconClassName?: string;
}

/**
 * Tooltip informativo discreto: ícone "?" que abre uma explicação curta.
 * Usado em labels de campos fiscais e termos técnicos do IRPF.
 */
export function InfoTooltip({ children, side = 'top', className, iconClassName }: Props) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Mais informações"
          className={cn(
            'inline-flex items-center text-muted-foreground hover:text-foreground transition-colors',
            className,
          )}
        >
          <HelpCircle className={cn('h-3.5 w-3.5', iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[280px] text-xs leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
