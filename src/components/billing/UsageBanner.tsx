import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsageStatus } from '@/hooks/useUsageStatus';

const CONFIG = {
  warning: {
    icon: TrendingUp,
    bg: 'bg-accent/10 border-accent/20',
    text: 'text-accent',
    msg: 'Você está crescendo. Considere um plano maior.',
    btn: 'outline' as const,
  },
  critical: {
    icon: AlertTriangle,
    bg: 'bg-warning/10 border-warning/20',
    text: 'text-warning',
    msg: 'Quase no limite. Não pare sua operação.',
    btn: 'outline' as const,
  },
  blocked: {
    icon: ShieldAlert,
    bg: 'bg-destructive/10 border-destructive/20',
    text: 'text-destructive',
    msg: 'Limite atingido. Faça upgrade para continuar.',
    btn: 'destructive' as const,
  },
};

export function UsageBanner() {
  const { level, usadas, limite } = useUsageStatus();
  const navigate = useNavigate();

  if (level === 'normal') return null;

  const c = CONFIG[level];
  const Icon = c.icon;

  return (
    <div className={`px-4 py-3 flex items-center justify-between gap-4 border-b ${c.bg}`}>
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`h-5 w-5 shrink-0 ${c.text}`} />
        <div className="min-w-0">
          <p className={`text-sm font-medium ${c.text}`}>{c.msg}</p>
          <p className="text-xs text-muted-foreground">
            {usadas}/{limite} declarações utilizadas
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={c.btn}
        onClick={() => navigate('/meus-planos')}
        className="shrink-0 gap-2"
      >
        <TrendingUp className="h-4 w-4" /> Upgrade
      </Button>
    </div>
  );
}
