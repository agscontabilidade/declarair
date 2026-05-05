import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBillingStatus } from '@/hooks/useBillingStatus';

export function BillingBanner() {
  const { isOverdue, isBlocked, isExpiringSoon, daysRemaining, plano } = useBillingStatus();
  const navigate = useNavigate();

  if (plano === 'gratuito') return null;
  if (!isOverdue && !isExpiringSoon) return null;

  const getColors = () => {
    if (isBlocked || isOverdue) return 'bg-destructive/10 border-b border-destructive/20 text-destructive';
    return 'bg-amber-500/10 border-b border-amber-500/20 text-amber-600';
  };

  const getMessage = () => {
    if (isBlocked) return 'Seu acesso está restrito por inadimplência. Regularize o pagamento para continuar usando a plataforma.';
    if (isOverdue) return 'Seu pagamento está em atraso. Regularize agora para evitar o bloqueio da conta.';
    if (isExpiringSoon) return `Sua assinatura vence em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}. Renove agora para evitar interrupções no serviço.`;
    return '';
  };

  return (
    <div className={`px-4 py-3 flex items-center justify-between gap-4 ${getColors()}`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">
          {getMessage()}
        </p>
      </div>
      <Button
        size="sm"
        variant={(isBlocked || isOverdue) ? 'destructive' : 'outline'}
        onClick={() => navigate('/checkout')}
        className={`shrink-0 gap-2 ${(isBlocked || isOverdue) ? '' : 'border-amber-500 text-amber-600 hover:bg-amber-500/10'}`}
      >
        <CreditCard className="h-4 w-4" /> 
        {(isBlocked || isOverdue) ? 'Regularizar Agora' : 'Renovar Agora'}
      </Button>
    </div>
  );
}

