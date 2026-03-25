import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBillingStatus } from '@/hooks/useBillingStatus';

export function BillingBanner() {
  const { isOverdue, isBlocked, plano } = useBillingStatus();
  const navigate = useNavigate();

  if (!isOverdue || plano === 'gratuito') return null;

  return (
    <div className={`px-4 py-3 flex items-center justify-between gap-4 ${isBlocked ? 'bg-destructive/10 border-b border-destructive/20' : 'bg-warning/10 border-b border-warning/20'}`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className={`h-5 w-5 shrink-0 ${isBlocked ? 'text-destructive' : 'text-warning'}`} />
        <p className={`text-sm font-medium ${isBlocked ? 'text-destructive' : 'text-warning'}`}>
          {isBlocked
            ? 'Seu acesso está restrito por pagamento em atraso. Regularize para continuar usando a plataforma.'
            : 'Você possui um pagamento pendente. Regularize para evitar restrições.'}
        </p>
      </div>
      <Button
        size="sm"
        variant={isBlocked ? 'destructive' : 'outline'}
        onClick={() => navigate('/planos')}
        className="shrink-0 gap-2"
      >
        <CreditCard className="h-4 w-4" /> Regularizar
      </Button>
    </div>
  );
}
