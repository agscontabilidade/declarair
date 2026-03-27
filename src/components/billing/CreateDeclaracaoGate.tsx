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

  const isFree = ['free', 'gratuito'].includes(planoAtual?.toLowerCase() ?? '');
  const isPro = ['pro', 'profissional'].includes(planoAtual?.toLowerCase() ?? '');

  // Pro users can always buy extras; Free users are blocked
  if (isPro && !atingiuLimiteDeclaracoes) {
    return <>{children}</>;
  }

  if (!atingiuLimiteDeclaracoes) {
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
              {isFree
                ? 'Faça upgrade para o Pro para desbloquear o sistema completo'
                : 'Compre declarações extras para continuar (R$ 9,90/cada)'}
            </p>
          </div>

          {showOptions ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {isPro && (
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
              )}

              {isFree && (
                <div className="p-4 bg-accent/5 rounded-lg border border-accent">
                  <p className="font-medium mb-2">Upgrade para Pro</p>
                  <p className="text-2xl font-bold text-accent mb-2">R$ 29,90/mês</p>
                  <p className="text-xs text-muted-foreground mb-2">3 declarações inclusas + extras por R$ 9,90</p>
                  <Button
                    size="sm"
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={() => navigate('/meus-planos')}
                  >
                    Fazer Upgrade
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={() => setShowOptions(true)}>Ver Opções</Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
