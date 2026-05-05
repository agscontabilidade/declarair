import { AlertTriangle, Clock } from 'lucide-react';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SubscriptionWarning() {
  const { isExpiringSoon, isOverdue, isBlocked, daysRemaining, proximaCobranca, plano } = useBillingStatus();
  const navigate = useNavigate();

  if (plano === 'gratuito') return null;

  if (isBlocked || isOverdue) {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>Assinatura vencida!</strong> Sua conta está bloqueada por inadimplência. Regularize o pagamento para continuar usando.
          </span>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => navigate('/checkout')}
          className="h-8 text-xs font-bold shrink-0 ml-4"
        >
          Regularizar agora
        </Button>
      </div>
    );
  }

  if (isExpiringSoon) {
    return (
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            Sua assinatura vence em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} ({proximaCobranca ? format(new Date(proximaCobranca), "dd 'de' MMMM", { locale: ptBR }) : '-'}). Evite o bloqueio renovando agora.
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/checkout')}
          className="h-8 text-xs bg-white/20 border-white text-white hover:bg-white/30 shrink-0 ml-4"
        >
          Renovar assinatura
        </Button>
      </div>
    );
  }

  return null;
}
