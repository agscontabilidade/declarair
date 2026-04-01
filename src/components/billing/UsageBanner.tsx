import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatarPreco, PRECOS } from '@/lib/constants/planos';
import { FileText, TrendingUp, ShoppingCart, Zap } from 'lucide-react';
import { useUsageStatus } from '@/hooks/useUsageStatus';

export function UsageBanner() {
  const { usadas, limite, plano, extras, loading } = useUsageStatus();
  const navigate = useNavigate();

  if (loading) return null;

  const isFree = plano === 'free';

  // FREE: mostrar progresso 0/1
  if (isFree) {
    const percentUsed = limite > 0 ? Math.min((usadas / limite) * 100, 100) : 0;
    const isAtLimit = usadas >= limite;

    return (
      <Card className={`p-4 ${isAtLimit ? 'border-destructive/50 bg-destructive/5' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">Plano Free</p>
              <p className="text-xs text-muted-foreground">
                {usadas} de {limite} declaração usada
              </p>
            </div>
          </div>

          {isAtLimit && (
            <Button size="sm" onClick={() => navigate('/planos')}>
              <Zap className="h-4 w-4 mr-2" />
              Fazer Upgrade
            </Button>
          )}
        </div>

        <Progress value={percentUsed} className="h-2" />

        {isAtLimit && (
          <p className="text-xs text-destructive mt-2">
            Você atingiu o limite do plano Free. Faça upgrade para criar declarações!
          </p>
        )}
      </Card>
    );
  }

  // PRO: mostrar declarações extras disponíveis
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-sm">Plano Pro</p>
            <p className="text-xs text-muted-foreground">
              {extras} declarações extras disponíveis · {usadas} usadas
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/addons?tab=declaracoes')}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Comprar Mais
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        Declarações extras: {formatarPreco(PRECOS.DECLARACAO_EXTRA.preco)} cada
      </div>
    </Card>
  );
}
