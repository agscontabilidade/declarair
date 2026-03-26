import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, ShieldAlert, TrendingUp, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';
import { PlanosCards } from '@/components/planos/PlanosCards';
import { AddonsMarketplace } from '@/components/planos/AddonsMarketplace';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Upgrade() {
  const navigate = useNavigate();
  const { planoAtual, declaracoesCount, limiteDeclaracoes, atingiuLimiteDeclaracoes } = useBilling();

  const limite = limiteDeclaracoes ?? 3;
  const percentual = limite > 0 ? Math.min((declaracoesCount / limite) * 100, 100) : 0;
  const proximoDoLimite = percentual > 80 && !atingiuLimiteDeclaracoes;
  const isPro = ['pro', 'profissional'].includes(planoAtual?.toLowerCase() ?? '');

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

        {/* Bloqueio */}
        {atingiuLimiteDeclaracoes && !isPro && (
          <Card className="border-destructive bg-destructive/5 shadow-lg animate-in fade-in slide-in-from-top-2">
            <CardContent className="p-6 md:p-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mx-auto">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-destructive">
                Você atingiu seu limite de declarações
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Seu escritório já utilizou todas as <strong>{limite}</strong> declarações disponíveis no plano Free. 
                Atualize agora para não perder clientes.
              </p>
              <Button
                size="lg"
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 text-lg px-8 py-6"
                onClick={() => navigate('/checkout?plano=pro')}
              >
                Atualizar para Pro agora <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Barra de uso (apenas Free) */}
        {!isPro && (
          <Card className={`border ${atingiuLimiteDeclaracoes ? 'border-destructive/30' : proximoDoLimite ? 'border-amber-500/30 bg-amber-500/5' : 'border-accent/20 bg-accent/5'}`}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${atingiuLimiteDeclaracoes ? 'bg-destructive/10' : proximoDoLimite ? 'bg-amber-500/10' : 'bg-accent/10'}`}>
                    <FileText className={`h-5 w-5 ${atingiuLimiteDeclaracoes ? 'text-destructive' : proximoDoLimite ? 'text-amber-600' : 'text-accent'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Uso de declarações</p>
                    <p className="text-2xl font-bold text-foreground">
                      {declaracoesCount} <span className="text-base font-normal text-muted-foreground">de {limite}</span>
                    </p>
                  </div>
                </div>
                <Badge
                  variant={atingiuLimiteDeclaracoes ? 'destructive' : 'secondary'}
                  className={`text-sm px-3 py-1 ${proximoDoLimite && !atingiuLimiteDeclaracoes ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' : ''}`}
                >
                  {Math.round(percentual)}% utilizado
                </Badge>
              </div>
              <Progress value={percentual} className={`h-3 ${atingiuLimiteDeclaracoes ? '[&>div]:bg-destructive' : proximoDoLimite ? '[&>div]:bg-amber-500' : ''}`} />

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
        )}

        {/* Tabs: Planos + Addons */}
        <Tabs defaultValue="planos">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="planos">Planos Base</TabsTrigger>
            <TabsTrigger value="addons">Recursos Extras</TabsTrigger>
          </TabsList>

          <TabsContent value="planos" className="mt-8">
            <PlanosCards onNavigate={(planoId) => navigate(`/checkout?plano=${planoId}`)} />
          </TabsContent>

          <TabsContent value="addons" className="mt-8">
            <AddonsMarketplace />
          </TabsContent>
        </Tabs>

        {/* Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Continue atendendo sem interrupção</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Com o Pro, seu escritório não precisa recusar clientes ou pausar operações durante a temporada de IR.
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
                  Cada declaração recusada é um cliente que pode migrar para a concorrência.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Final */}
        {!isPro && (
          <div className="text-center space-y-3 pt-4">
            <Button
              size="lg"
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-6 shadow-lg"
              onClick={() => navigate('/checkout?plano=pro')}
            >
              <TrendingUp className="h-5 w-5" /> Fazer upgrade agora
            </Button>
            <p className="text-sm text-muted-foreground">
              Sem contrato. Cancele quando quiser.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
