import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface QueryErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function QueryError({ 
  title = 'Erro ao carregar dados',
  message = 'Ocorreu um erro ao buscar as informações. Tente novamente.',
  onRetry 
}: QueryErrorProps) {
  return (
    <Alert variant="destructive" className="mx-auto max-w-md">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        {message}
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-3 w-full"
          >
            Tentar novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
