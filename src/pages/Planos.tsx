import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Crown, Zap, Building2, Rocket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription, useCancelSubscription } from '@/hooks/useBilling';

const PLANOS = [
  {
    id: 'gratuito',
    nome: 'Gratuito',
    preco: 'R$ 0',
    periodo: '/mês',
    icon: Zap,
    destaque: false,
    features: {
      declaracoes: '5',
      usuarios: '1',
      storage: '500 MB',
      whitelabel: false,
      malhaFina: false,
      calculadora: false,
      chat: false,
      afiliados: false,
      suporte: 'Email',
    },
  },
  {
    id: 'starter',
    nome: 'Starter',
    preco: 'R$ 29,90',
    periodo: '/mês',
    icon: Rocket,
    destaque: false,
    features: {
      declaracoes: '10',
      usuarios: '1',
      storage: '10 GB',
      whitelabel: false,
      malhaFina: true,
      calculadora: true,
      chat: true,
      afiliados: false,
      suporte: 'Email',
    },
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    preco: 'R$ 49,90',
    periodo: '/mês',
    icon: Crown,
    destaque: true,
    features: {
      declaracoes: '20',
      usuarios: '5',
      storage: '30 GB',
      whitelabel: true,
      malhaFina: true,
      calculadora: true,
      chat: true,
      afiliados: true,
      suporte: 'Prioritário',
    },
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 'Sob consulta',
    periodo: '',
    icon: Building2,
    destaque: false,
    features: {
      declaracoes: 'Ilimitado',
      usuarios: 'Ilimitado',
      storage: 'Personalizado',
      whitelabel: true,
      malhaFina: true,
      calculadora: true,
      chat: true,
      afiliados: true,
      suporte: 'Dedicado',
    },
  },
];

const FEATURE_LABELS: Record<string, string> = {
  declaracoes: 'Declarações inclusas',
  usuarios: 'Usuários',
  storage: 'Armazenamento',
  whitelabel: 'Whitelabel',
  malhaFina: 'Malha Fina',
  calculadora: 'Calculadora IR',
  chat: 'Chat integrado',
  afiliados: 'Programa de Afiliados',
  suporte: 'Suporte',
};

const AVULSO = [
  { range: '1–9', preco: 'R$ 7,90' },
  { range: '10–24', preco: 'R$ 6,50' },
  { range: '25–49', preco: 'R$ 5,50' },
  { range: '50–99', preco: 'R$ 4,50' },
  { range: '100–249', preco: 'R$ 3,90' },
  { range: '250–499', preco: 'R$ 3,50' },
  { range: '500+', preco: 'R$ 2,99' },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-4 w-4 text-success" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground/40" />
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export default function Planos() {
  const { profile } = useAuth();
  const escritorioId = profile.escritorioId;

  const { data: escritorio } = useQuery({
    queryKey: ['escritorio-plano', escritorioId],
    queryFn: async () => {
      const { data } = await supabase.from('escritorios').select('plano').eq('id', escritorioId!).single();
      return data;
    },
    enabled: !!escritorioId,
  });

  const planoAtual = escritorio?.plano || 'gratuito';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Planos & Preços</h1>
          <p className="text-muted-foreground mt-2">Escolha o plano ideal para o seu escritório</p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANOS.map((plano) => {
            const Icon = plano.icon;
            const isCurrent = planoAtual === plano.id;
            return (
              <Card
                key={plano.id}
                className={`relative flex flex-col ${plano.destaque ? 'ring-2 ring-accent shadow-lg' : 'shadow-sm'}`}
              >
                {plano.destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground text-xs">Mais popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${plano.destaque ? 'text-accent' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-lg">{plano.nome}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{plano.preco}</span>
                    <span className="text-muted-foreground text-sm">{plano.periodo}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    {Object.entries(plano.features).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{FEATURE_LABELS[key]}</span>
                        <FeatureValue value={value} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6">
                    {isCurrent ? (
                      <Button className="w-full" variant="outline" disabled>Plano Atual</Button>
                    ) : plano.id === 'enterprise' ? (
                      <Button className="w-full" variant="outline">Falar com Vendas</Button>
                    ) : (
                      <Button className={`w-full ${plano.destaque ? 'bg-accent hover:bg-accent/90' : ''}`}>
                        {planoAtual === 'gratuito' ? 'Começar' : 'Upgrade'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Volume pricing */}
        <Card className="shadow-sm max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg text-center">Declarações Avulsas</CardTitle>
            <p className="text-sm text-muted-foreground text-center">Compre declarações adicionais com desconto por volume</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {AVULSO.map((item) => (
                <div key={item.range} className="text-center p-3 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground">{item.range}</p>
                  <p className="text-sm font-bold mt-1">{item.preco}</p>
                  <p className="text-[10px] text-muted-foreground">por decl.</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
