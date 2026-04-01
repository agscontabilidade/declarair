import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getPlanoConfig, PRECOS, formatarPreco } from '@/lib/constants/planos';
import { AlertCircle, ShoppingCart } from 'lucide-react';

interface CreateDeclaracaoGateProps {
  children: ReactNode;
  onCanCreate?: (canCreate: boolean) => void;
}

export function CreateDeclaracaoGate({ children, onCanCreate }: CreateDeclaracaoGateProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [planoAtual, setPlanoAtual] = useState<'free' | 'pro'>('free');
  const [declaracoesUsadas, setDeclaracoesUsadas] = useState(0);

  useEffect(() => {
    async function checkLimits() {
      try {
        const escritorioId = profile.escritorioId;
        if (!escritorioId) return;

        // Buscar dados do escritório
        const { data: escritorio } = await supabase
          .from('escritorios')
          .select('plano, declaracoes_utilizadas, limite_declaracoes')
          .eq('id', escritorioId)
          .single();

        const planoNome = escritorio?.plano || 'gratuito';
        const normalized = planoNome.toLowerCase();
        const isPro = normalized === 'pro' || normalized === 'profissional';
        setPlanoAtual(isPro ? 'pro' : 'free');

        const usadas = escritorio?.declaracoes_utilizadas ?? 0;
        setDeclaracoesUsadas(usadas);

        if (!isPro) {
          // Free: máximo 1 declaração, SEM extras
          const planoConfig = getPlanoConfig(planoNome);
          const podeCrear = usadas < planoConfig.limites.declaracoes;
          setCanCreate(podeCrear);
          onCanCreate?.(podeCrear);
        } else {
          // PRO: 0 inclusas no plano base, precisa de extras compradas
          // O limite real vem do campo limite_declaracoes do escritório
          // que é incrementado ao comprar extras
          const limite = escritorio?.limite_declaracoes ?? 0;
          const podeCrear = usadas < limite;
          setCanCreate(podeCrear);
          onCanCreate?.(podeCrear);
        }
      } catch (error) {
        console.error('[Gate] Erro ao verificar limites:', error);
        setCanCreate(false);
        onCanCreate?.(false);
      } finally {
        setLoading(false);
      }
    }

    if (profile.escritorioId) {
      checkLimits();
    }
  }, [profile.escritorioId, onCanCreate]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground text-sm">Verificando limites...</div>;
  }

  if (canCreate) {
    return <>{children}</>;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {planoAtual === 'free' ? (
          <div className="space-y-3">
            <p className="font-medium">Limite do plano Free atingido</p>
            <p className="text-sm">
              Você já usou sua declaração de teste ({declaracoesUsadas}/1).
              Faça upgrade para o plano Pro para criar declarações.
            </p>
            <Button onClick={() => navigate('/planos')} size="sm">
              Ver Planos
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-medium">Sem declarações extras disponíveis</p>
            <p className="text-sm">
              Você precisa comprar declarações extras para continuar.
              Cada declaração custa {formatarPreco(PRECOS.DECLARACAO_EXTRA.preco)}.
            </p>
            <Button
              onClick={() => navigate('/addons?tab=declaracoes')}
              size="sm"
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Comprar Declarações
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
