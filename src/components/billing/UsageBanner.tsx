import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp, ShoppingCart, Zap, AlertTriangle } from 'lucide-react';
import { useUsageStatus } from '@/hooks/useUsageStatus';

export function UsageBanner() {
  const { usadas, limite, plano, extras, loading } = useUsageStatus();
  const navigate = useNavigate();

  if (loading) return null;

  const isFree = plano === 'free';

  // FREE: só aparece quando limite atingido
  if (isFree) {
    const isAtLimit = usadas >= limite;
    if (!isAtLimit) return null;

    return (
      <Card className="p-4 border-destructive/50 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-sm">Plano Free — limite atingido</p>
              <p className="text-xs text-muted-foreground">
                Você usou {usadas} de {limite} declaração. Faça upgrade para criar mais.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => navigate('/meus-planos')}>
            <Zap className="h-4 w-4 mr-2" />
            Fazer Upgrade
          </Button>
        </div>
      </Card>
    );
  }

  // PRO: só aparece quando faltam <= 2 declarações
  if (extras > 2) return null;

  const semExtras = extras <= 0;

  return (
    <Card className="p-4 border-warning/40 bg-warning/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {semExtras ? (
            <AlertTriangle className="h-5 w-5 text-warning" />
          ) : (
            <TrendingUp className="h-5 w-5 text-warning" />
          )}
          <div>
            <p className="font-medium text-sm">
              {semExtras ? 'Limite de declarações atingido' : 'Suas declarações estão acabando'}
            </p>
            <p className="text-xs text-muted-foreground">
              {semExtras
                ? 'Compre mais declarações para continuar atendendo seus clientes.'
                : `Faltam ${extras} declaração${extras === 1 ? '' : 'ões'} — adicione mais para não interromper o atendimento.`}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/addons?tab=declaracoes')}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Comprar Mais
        </Button>
      </div>
    </Card>
  );
}
