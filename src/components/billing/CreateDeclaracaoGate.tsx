import { ReactNode, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBilling } from '@/hooks/useBilling';
import { useDeclaracoesExtras } from '@/hooks/useDeclaracoesExtras';

interface CreateDeclaracaoGateProps {
  children: ReactNode;
}

export function CreateDeclaracaoGate({ children }: CreateDeclaracaoGateProps) {
  const navigate = useNavigate();
  const { atingiuLimiteDeclaracoes, planoAtual } = useBilling();
  const { comprarDeclaracao } = useDeclaracoesExtras();
  const [showOptions, setShowOptions] = useState(false);

  const isPro = ['pro', 'profissional'].includes(planoAtual?.toLowerCase() ?? '');

  if (isPro || !atingiuLimiteDeclaracoes) {
    return <>{children}</>;
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-4">
          <div>
            <p className="font-semibold mb-1">Limite de declarações atingido</p>
            <p className="text-sm">
              Você precisa fazer upgrade ou comprar declarações extras para continuar
            </p>
          </div>

          {showOptions ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-4 bg-card rounded-lg border">
                <p className="font-medium mb-2">Comprar 1 Extra</p>
                <p className="text-2xl font-bold text-accent mb-2">R$ 9,90</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => comprarDeclaracao.mutate(1)}
                  disabled={comprarDeclaracao.isPending}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Comprar Agora
                </Button>
              </div>

              <div className="p-4 bg-accent/5 rounded-lg border border-accent">
                <p className="font-medium mb-2">Upgrade para Pro</p>
                <p className="text-2xl font-bold text-accent mb-2">R$ 49,90/mês</p>
                <Button
                  size="sm"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => navigate('/meus-planos')}
                >
                  Ilimitadas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowOptions(true)}>Ver Opções</Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
