import { Navigate } from 'react-router-dom';
import { useBillingStatus } from '@/hooks/useBillingStatus';

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
