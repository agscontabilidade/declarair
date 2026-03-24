import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedType: 'contador' | 'cliente';
}

export function ProtectedRoute({ children, allowedType }: ProtectedRouteProps) {
  const { session, userType, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={allowedType === 'cliente' ? '/cliente/login' : '/login'} replace />;
  }

  if (userType !== allowedType) {
    if (userType === 'contador') return <Navigate to="/dashboard" replace />;
    if (userType === 'cliente') return <Navigate to="/cliente/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  // Block contador from dashboard if onboarding not complete
  if (allowedType === 'contador' && profile.onboardingCompleto === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
