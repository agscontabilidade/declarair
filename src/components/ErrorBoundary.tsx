import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Algo deu errado</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Ocorreu um erro inesperado. Já fomos notificados e estamos trabalhando para resolver.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Recarregar Página
              </Button>
              <Button onClick={() => (window.location.href = '/dashboard')} variant="outline" className="w-full">
                Voltar ao Dashboard
              </Button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm cursor-pointer text-muted-foreground">Detalhes do erro</summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
