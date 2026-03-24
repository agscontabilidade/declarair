import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, Crown, Zap, Rocket, Building2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PLANOS = [
  { id: 'gratuito', nome: 'Gratuito', preco: 'R$ 0', icon: Zap, declaracoes: 5, usuarios: 1, storage: '500 MB' },
  { id: 'starter', nome: 'Starter', preco: 'R$ 29,90', icon: Rocket, declaracoes: 10, usuarios: 1, storage: '10 GB' },
  { id: 'profissional', nome: 'Profissional', preco: 'R$ 49,90', icon: Crown, declaracoes: 20, usuarios: 5, storage: '30 GB', destaque: true },
  { id: 'enterprise', nome: 'Enterprise', preco: 'R$ 199,90', icon: Building2, declaracoes: 9999, usuarios: 9999, storage: 'Ilimitado' },
];

export default function Upgrade() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const { data: escritorio } = useQuery({
    queryKey: ['escritorio-upgrade', profile.escritorioId],
    queryFn: async () => {
      const { data } = await supabase
        .from('escritorios')
        .select('plano, limite_declaracoes, declaracoes_utilizadas')
        .eq('id', profile.escritorioId!)
        .single();
      return data;
    },
    enabled: !!profile.escritorioId,
  });

  const planoAtual = escritorio?.plano || 'gratuito';
  const usadas = escritorio?.declaracoes_utilizadas || 0;
  const limite = escritorio?.limite_declaracoes || 5;
  const percentual = Math.min((usadas / limite) * 100, 100);
  const planoAtualIdx = PLANOS.findIndex((p) => p.id === planoAtual);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold">Aumente seu potencial</h1>
          <p className="text-muted-foreground mt-2">Seu escritório está crescendo. Escolha o plano ideal.</p>
        </div>

        {/* Usage card */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Uso atual de declarações</p>
                <p className="text-2xl font-bold">{usadas} <span className="text-base font-normal text-muted-foreground">/ {limite === 9999 ? '∞' : limite}</span></p>
              </div>
              <Badge variant={percentual > 80 ? 'destructive' : 'secondary'}>{Math.round(percentual)}% utilizado</Badge>
            </div>
            <Progress value={percentual} className="h-3" />
            {percentual > 80 && (
              <p className="text-sm text-destructive mt-2 font-medium">
                ⚠️ Você está próximo do limite! Faça upgrade para continuar atendendo seus clientes.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Plans comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANOS.map((plano, idx) => {
            const Icon = plano.icon;
            const isCurrent = planoAtual === plano.id;
            const isDowngrade = idx < planoAtualIdx;
            const isUpgrade = idx > planoAtualIdx;

            return (
              <Card
                key={plano.id}
                className={`relative flex flex-col ${plano.destaque ? 'ring-2 ring-accent shadow-lg' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs">Plano Atual</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <Icon className={`h-8 w-8 mx-auto mb-2 ${plano.destaque ? 'text-accent' : 'text-muted-foreground'}`} />
                  <CardTitle className="text-lg">{plano.nome}</CardTitle>
                  <p className="text-2xl font-bold mt-1">{plano.preco}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 flex-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Declarações</span><span className="font-medium">{plano.declaracoes === 9999 ? 'Ilimitado' : plano.declaracoes}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Usuários</span><span className="font-medium">{plano.usuarios === 9999 ? 'Ilimitado' : plano.usuarios}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Storage</span><span className="font-medium">{plano.storage}</span></div>
                  </div>
                  <div className="mt-4">
                    {isCurrent ? (
                      <Button variant="outline" disabled className="w-full">Plano Atual</Button>
                    ) : isUpgrade ? (
                      <Button
                        onClick={() => navigate(`/checkout?plano=${plano.id}`)}
                        className={`w-full gap-2 ${plano.destaque ? 'bg-accent hover:bg-accent/90' : ''}`}
                      >
                        Fazer Upgrade <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                        Downgrade
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
