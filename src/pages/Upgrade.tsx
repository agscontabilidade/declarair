import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Zap, Rocket, Building2, ArrowRight, AlertTriangle, ShieldAlert, TrendingUp, Users, HardDrive, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PLANOS = [
  {
    id: 'gratuito', nome: 'Gratuito', preco: 'R$ 0', precoNum: 0, icon: Zap,
    declaracoes: 5, usuarios: 1, storage: '500 MB',
    features: ['Kanban básico', 'Chat com cliente', 'Checklist documentos'],
    missing: ['Malha fina automática', 'Whitelabel', 'Suporte prioritário'],
  },
  {
    id: 'starter', nome: 'Starter', preco: 'R$ 29,90', precoNum: 29.9, icon: Rocket,
    declaracoes: 10, usuarios: 1, storage: '10 GB',
    features: ['Tudo do Gratuito', 'Malha fina automática', 'Templates de mensagem', 'Relatórios básicos'],
    missing: ['Whitelabel', 'Suporte prioritário'],
  },
  {
    id: 'profissional', nome: 'Profissional', preco: 'R$ 49,90', precoNum: 49.9, icon: Crown,
    declaracoes: 20, usuarios: 5, storage: '30 GB', destaque: true,
    features: ['Tudo do Starter', 'Whitelabel completo', 'Multi-usuários', 'Suporte prioritário', 'API de cobranças'],
    missing: [],
  },
  {
    id: 'enterprise', nome: 'Enterprise', preco: 'R$ 199,90', precoNum: 199.9, icon: Building2,
    declaracoes: 9999, usuarios: 9999, storage: 'Ilimitado',
    features: ['Tudo do Profissional', 'Declarações ilimitadas', 'Usuários ilimitados', 'Gerente de conta dedicado', 'SLA garantido'],
    missing: [],
  },
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
  const planoAtualData = PLANOS[planoAtualIdx];
  const proximoPlano = planoAtualIdx < PLANOS.length - 1 ? PLANOS[planoAtualIdx + 1] : null;
  const atingiuLimite = percentual >= 100;
  const proximoDoLimite = percentual > 80 && !atingiuLimite;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">

        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Escale seu escritório sem limites
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Continue atendendo clientes sem interrupção. Escolha o plano ideal para o seu crescimento.
          </p>
        </div>

        {/* ===== BLOQUEIO ===== */}
        {atingiuLimite && (
          <Card className="border-destructive bg-destructive/5 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CardContent className="p-6 md:p-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-destructive">
                Você atingiu seu limite de declarações
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Seu escritório já utilizou todas as <strong>{limite}</strong> declarações disponíveis no plano <strong>{planoAtualData?.nome}</strong>. 
                Atualize agora para não perder clientes.
              </p>
              <Button
                size="lg"
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 text-lg px-8 py-6"
                onClick={() => proximoPlano && navigate(`/checkout?plano=${proximoPlano.id}`)}
              >
                Atualizar plano agora <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ===== BARRA DE USO ===== */}
        <Card className={`border ${atingiuLimite ? 'border-destructive/30' : proximoDoLimite ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/20 bg-primary/5'}`}>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${atingiuLimite ? 'bg-destructive/10' : proximoDoLimite ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                  <FileText className={`h-5 w-5 ${atingiuLimite ? 'text-destructive' : proximoDoLimite ? 'text-amber-600' : 'text-primary'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Uso de declarações</p>
                  <p className="text-2xl font-bold text-foreground">
                    {usadas} <span className="text-base font-normal text-muted-foreground">de {limite === 9999 ? '∞' : limite}</span>
                  </p>
                </div>
              </div>
              <Badge
                variant={atingiuLimite ? 'destructive' : 'secondary'}
                className={`text-sm px-3 py-1 ${proximoDoLimite && !atingiuLimite ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' : ''}`}
              >
                {Math.round(percentual)}% utilizado
              </Badge>
            </div>
            <Progress value={percentual} className={`h-3 ${atingiuLimite ? '[&>div]:bg-destructive' : proximoDoLimite ? '[&>div]:bg-amber-500' : ''}`} />

            {/* Alerta >80% */}
            {proximoDoLimite && (
              <div className="flex items-start gap-3 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Você está próximo do limite</p>
                  <p className="text-sm text-amber-700">
                    Evite parar sua operação. Faça upgrade agora e continue atendendo sem interrupção.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== COMPARAÇÃO PLANO ATUAL vs PRÓXIMO ===== */}
        {proximoPlano && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plano atual */}
            <Card className="border-muted">
              <CardHeader className="text-center pb-3">
                <Badge variant="outline" className="mx-auto mb-2 text-xs">Plano Atual</Badge>
                <planoAtualData.icon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <CardTitle className="text-xl">{planoAtualData.nome}</CardTitle>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {planoAtualData.preco}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{planoAtualData.declaracoes === 9999 ? 'Ilimitado' : planoAtualData.declaracoes} declarações</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{planoAtualData.usuarios === 9999 ? 'Ilimitado' : planoAtualData.usuarios} usuário(s)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>{planoAtualData.storage} armazenamento</span>
                </div>
                <div className="border-t pt-3 mt-3 space-y-2">
                  {planoAtualData.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {f}
                    </div>
                  ))}
                  {planoAtualData.missing.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground/50">
                      <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" /> {f}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Próximo plano */}
            <Card className="border-accent ring-2 ring-accent/50 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent to-primary" />
              <CardHeader className="text-center pb-3">
                <Badge className="mx-auto mb-2 bg-accent text-accent-foreground text-xs">Recomendado</Badge>
                <proximoPlano.icon className="h-10 w-10 mx-auto text-accent mb-2" />
                <CardTitle className="text-xl">{proximoPlano.nome}</CardTitle>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {proximoPlano.preco}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4 text-accent" />
                  <span>{proximoPlano.declaracoes === 9999 ? 'Ilimitado' : proximoPlano.declaracoes} declarações</span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-accent/10 text-accent">
                    +{(proximoPlano.declaracoes === 9999 ? '∞' : proximoPlano.declaracoes - planoAtualData.declaracoes)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-accent" />
                  <span>{proximoPlano.usuarios === 9999 ? 'Ilimitado' : proximoPlano.usuarios} usuário(s)</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <HardDrive className="h-4 w-4 text-accent" />
                  <span>{proximoPlano.storage} armazenamento</span>
                </div>
                <div className="border-t pt-3 mt-3 space-y-2">
                  {proximoPlano.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {f}
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="w-full mt-4 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
                  onClick={() => navigate(`/checkout?plano=${proximoPlano.id}`)}
                >
                  <TrendingUp className="h-5 w-5" /> Fazer upgrade agora
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== BENEFÍCIO + URGÊNCIA ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Continue atendendo sem interrupção</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Com mais declarações disponíveis, seu escritório não precisa recusar clientes ou pausar operações durante a temporada de IR.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-destructive/10 shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Evite perder clientes por limite de uso</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cada declaração recusada é um cliente que pode migrar para a concorrência. Garanta capacidade para toda a sua demanda.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== TODOS OS PLANOS ===== */}
        <div>
          <h2 className="font-display text-xl font-bold text-center mb-6 text-foreground">Todos os planos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANOS.map((plano, idx) => {
              const Icon = plano.icon;
              const isCurrent = planoAtual === plano.id;
              const isUpgrade = idx > planoAtualIdx;

              return (
                <Card
                  key={plano.id}
                  className={`relative flex flex-col transition-all hover:shadow-md ${plano.destaque ? 'ring-2 ring-accent shadow-lg' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-xs">Atual</Badge>
                    </div>
                  )}
                  {plano.destaque && !isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-accent text-accent-foreground text-xs">Mais popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-6">
                    <Icon className={`h-7 w-7 mx-auto mb-2 ${plano.destaque ? 'text-accent' : 'text-muted-foreground'}`} />
                    <CardTitle className="text-base">{plano.nome}</CardTitle>
                    <p className="text-xl font-bold mt-1 text-foreground">
                      {plano.preco}<span className="text-xs font-normal text-muted-foreground">/mês</span>
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col text-sm">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Declarações</span>
                        <span className="font-medium">{plano.declaracoes === 9999 ? '∞' : plano.declaracoes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Usuários</span>
                        <span className="font-medium">{plano.usuarios === 9999 ? '∞' : plano.usuarios}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Storage</span>
                        <span className="font-medium">{plano.storage}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      {isCurrent ? (
                        <Button variant="outline" disabled className="w-full text-xs">Plano Atual</Button>
                      ) : isUpgrade ? (
                        <Button
                          onClick={() => navigate(`/checkout?plano=${plano.id}`)}
                          className={`w-full gap-1.5 text-xs ${plano.destaque ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''}`}
                          size="sm"
                        >
                          Upgrade <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button variant="ghost" className="w-full text-muted-foreground text-xs" disabled size="sm">
                          —
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center space-y-3 pt-4">
          <Button
            size="lg"
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-6 shadow-lg"
            onClick={() => proximoPlano && navigate(`/checkout?plano=${proximoPlano.id}`)}
          >
            <TrendingUp className="h-5 w-5" /> Fazer upgrade agora
          </Button>
          <p className="text-sm text-muted-foreground">
            Sem contrato. Cancele quando quiser.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
