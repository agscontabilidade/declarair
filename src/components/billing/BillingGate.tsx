import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import { useBilling } from '@/hooks/useBilling';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BillingGateProps {
  children: React.ReactNode;
  allowWhenBlocked?: boolean;
}

export function BillingGate({ children, allowWhenBlocked = false }: BillingGateProps) {
  const { isBlocked, loading } = useBillingStatus();

  // Só redirecionamos quando temos certeza (loading=false E isBlocked=true).
  // Durante o carregamento o default de `isBlocked` é false (plano "gratuito"
  // não é bloqueado), então não há falso-positivo. Renderizar o conteúdo em
  // paralelo elimina o spinner extra entre auth e Dashboard.
  if (!loading && isBlocked && !allowWhenBlocked) {
    return <Navigate to="/checkout" replace />;
  }

  return <>{children}</>;
}

/* ── Plan gate – requires specific plan ── */

interface PlanGateProps {
  requiredPlan: 'pro';
  featureName: string;
  children: ReactNode;
}

export function PlanGate({ requiredPlan, featureName, children }: PlanGateProps) {
  const { planoAtual } = useBilling();
  const navigate = useNavigate();

  const isPro = planoAtual.toLowerCase() === 'pro' || planoAtual.toLowerCase() === 'profissional';

  if (requiredPlan === 'pro' && !isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Crown className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {featureName} — Recurso do Plano Pro
        </h3>
        <p className="text-muted-foreground max-w-md">
          Esta funcionalidade está disponível exclusivamente para assinantes do plano Pro. Faça upgrade para desbloquear.
        </p>
        <Button onClick={() => navigate('/meus-planos')} className="gap-2">
          <Crown className="h-4 w-4" /> Fazer Upgrade
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

/* ── Feature gate for addons ── */

interface FeatureGateProps {
  feature: 'whatsapp' | 'portal_cliente' | 'api_publica' | 'whitelabel';
  children: ReactNode;
  fallback?: ReactNode;
}

const featureNames: Record<string, string> = {
  whatsapp: 'WhatsApp',
  portal_cliente: 'Portal do Cliente',
  api_publica: 'API Pública',
  whitelabel: 'Whitelabel',
};

const featurePrices: Record<string, number> = {
  whatsapp: 19.90,
  portal_cliente: 14.90,
  api_publica: 29.90,
  whitelabel: 9.90,
};

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasAddon } = useBilling();
  const navigate = useNavigate();

  if (hasAddon(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {featureNames[feature]} não ativado
      </h3>
      <p className="text-muted-foreground max-w-md">
        Ative o recurso <strong>{featureNames[feature]}</strong> por{' '}
        <strong>R$ {featurePrices[feature].toFixed(2).replace('.', ',')}/mês</strong> na área de Recursos Extras.
      </p>
      <Button size="sm" onClick={() => navigate('/addons')} className="gap-2">
        <Lock className="h-4 w-4" /> Ativar Recurso
      </Button>
    </div>
  );
}
