import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBilling } from '@/hooks/useBilling';

export function DeclaracoesLimitBanner() {
  const navigate = useNavigate();
  const {
    planoAtual,
    declaracoesCount,
    declaracoesRestantes,
    atingiuLimiteDeclaracoes,
    limiteDeclaracoes,
  } = useBilling();

  const isPro = ['pro', 'profissional'].includes(planoAtual?.toLowerCase() ?? '');
  if (isPro || !limiteDeclaracoes) return null;

  const progresso = Math.min((declaracoesCount / limiteDeclaracoes) * 100, 100);

  if (atingiuLimiteDeclaracoes) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <p className="font-semibold mb-1">
              Você atingiu o limite de {limiteDeclaracoes} declarações
            </p>
            <p className="text-sm">
              Faça upgrade para Pro e tenha declarações ilimitadas ou compre extras
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate('/meus-planos')}>
              Comprar Extras
            </Button>
            <Button size="sm" onClick={() => navigate('/meus-planos')}>
              Upgrade para Pro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (declaracoesRestantes <= 1) {
    return (
      <Alert className="mb-6 border-amber-500 bg-amber-500/5">
        <TrendingUp className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-amber-900 dark:text-amber-100">
                Restam apenas {declaracoesRestantes} declaração(ões)
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate('/meus-planos')}>
                Ver Opções
              </Button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-amber-700 dark:text-amber-300">
                <span>{declaracoesCount} de {limiteDeclaracoes} usadas</span>
                <span>{progresso.toFixed(0)}%</span>
              </div>
              <Progress value={progresso} className="h-2" />
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
