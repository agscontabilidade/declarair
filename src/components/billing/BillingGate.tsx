import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import { useBilling } from '@/hooks/useBilling';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BillingGateProps {
  children: React.ReactNode;
  /** Routes that should always be accessible even when blocked */
  allowWhenBlocked?: boolean;
}

/**
 * Wraps routes that should be blocked when billing is overdue.
 * Always allows access to /meus-planos, /configuracoes, /perfil.
 */
export function BillingGate({ children, allowWhenBlocked = false }: BillingGateProps) {
  const { isBlocked, loading } = useBillingStatus();

  if (loading) return null;

  if (isBlocked && !allowWhenBlocked) {
    return <Navigate to="/meus-planos" replace />;
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
    <Alert>
      <Lock className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>
          O recurso <strong>{featureNames[feature]}</strong> está disponível por{' '}
          <strong>R$ {featurePrices[feature].toFixed(2)}/mês</strong>
        </span>
        <Button size="sm" onClick={() => navigate('/addons')}>
          Ativar Agora
        </Button>
      </AlertDescription>
    </Alert>
  );
}
