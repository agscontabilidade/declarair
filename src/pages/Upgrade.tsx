import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowRight,
  Check,
  Crown,
  Zap,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useBilling } from '@/hooks/useBilling';
import { useDeclaracoesExtras } from '@/hooks/useDeclaracoesExtras';
import { AddonsMarketplace } from '@/components/planos/AddonsMarketplace';

export default function Upgrade() {
  const navigate = useNavigate();
  const {
    planoAtual,
    declaracoesCount,
    declaracoesRestantes,
    atingiuLimiteDeclaracoes,
    limiteDeclaracoes,
  } = useBilling();
  const { comprarDeclaracao } = useDeclaracoesExtras();
  const [quantidade, setQuantidade] = useState(1);

  const isFree = ['free', 'gratuito'].includes(planoAtual?.toLowerCase() ?? '');
  const isPro = ['pro', 'profissional'].includes(planoAtual?.toLowerCase() ?? '');

  const progressoDeclaracoes = limiteDeclaracoes
    ? Math.min((declaracoesCount / limiteDeclaracoes) * 100, 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">Planos e Recursos</h1>
          <p className="text-muted-foreground">
            Gerencie seu plano, recursos adicionais e uso da plataforma
          </p>
        </div>

        {/* Plano Atual */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isFree ? (
                  <div className="h-12 w-12 bg-muted rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="h-12 w-12 bg-accent/15 rounded-xl flex items-center justify-center">
                    <Crown className="h-6 w-6 text-accent" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-2xl">
                    Plano {isPro ? 'Pro' : 'Free'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isFree ? 'Gratuito' : 'R$ 49,90/mês'}
                  </p>
                </div>
              </div>
              <Badge variant={isFree ? 'secondary' : 'default'} className="text-sm">
                Ativo
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Uso de Declarações */}
            {isFree && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Declarações Ativas</span>
                  <span className="text-muted-foreground">
                    {declaracoesCount} de {limiteDeclaracoes} usadas
                  </span>
                </div>
                <Progress value={progressoDeclaracoes} className="h-2" />

                {atingiuLimiteDeclaracoes && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você atingiu o limite de {limiteDeclaracoes} declarações do plano Free
                    </AlertDescription>
                  </Alert>
                )}

                {!atingiuLimiteDeclaracoes && declaracoesRestantes <= 1 && (
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      Restam apenas {declaracoesRestantes} declaração(ões) disponível(eis)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

             {isPro && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span className="text-accent font-medium">3 declarações inclusas + extras por R$ 4,90/cada</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Declarações Ativas</span>
                  <span className="text-muted-foreground">
                    {declaracoesCount} ativas
                  </span>
                </div>
                <Progress value={limiteDeclaracoes ? Math.min((declaracoesCount / limiteDeclaracoes) * 100, 100) : 0} className="h-2" />
              </div>
            )}

            {/* Grid de Recursos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
               <div className="text-center">
                <p className="text-2xl font-bold">{isPro ? '3+' : '1'}</p>
                 <p className="text-xs text-muted-foreground">Declarações</p>
               </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{isPro ? '5' : '1'}</p>
                <p className="text-xs text-muted-foreground">Usuários</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{isPro ? '∞' : '500'}</p>
                <p className="text-xs text-muted-foreground">{isPro ? 'Storage' : 'MB'}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{isPro ? '✓' : '—'}</p>
                <p className="text-xs text-muted-foreground">Prioritário</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue={isFree ? 'upgrade' : 'addons'}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
          {isFree && <TabsTrigger value="upgrade">Upgrade</TabsTrigger>}
            <TabsTrigger value="extras">Declarações Extras</TabsTrigger>
            <TabsTrigger value="addons">Recursos Adicionais</TabsTrigger>
          </TabsList>

          {/* Upgrade para Pro */}
          {isFree && (
            <TabsContent value="upgrade" className="mt-6">
              <Card className="border-accent border-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-accent/15 rounded-xl flex items-center justify-center">
                      <Crown className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle>Faça Upgrade para Pro</CardTitle>
                       <p className="text-sm text-muted-foreground">
                        Sistema completo com declarações sob demanda
                       </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="font-semibold text-sm">O que você ganha:</p>
                      <div className="space-y-2">
                         {[
                          { bold: 'Declarações sob demanda', text: ' por R$ 9,90/cada' },
                          { bold: 'Até 5 usuários simultâneos', text: '' },
                          { bold: 'Storage ilimitado', text: '' },
                          { bold: 'Malha Fina + Calculadora IR', text: '' },
                          { bold: 'Suporte prioritário', text: '' },
                        ].map((item) => (
                          <div key={item.bold} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                            <span className="text-sm">
                              <strong>{item.bold}</strong>{item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-center">
                      <div className="text-center p-6 bg-accent/5 rounded-xl">
                        <p className="text-sm text-muted-foreground mb-2">Por apenas</p>
                        <p className="text-4xl font-bold text-accent">R$ 29,90</p>
                        <p className="text-sm text-muted-foreground">/mês</p>
                      </div>

                      <Button
                        size="lg"
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                        onClick={() => navigate('/checkout?plano=pro')}
                      >
                        Fazer Upgrade Agora
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Cancele quando quiser. Sem taxas escondidas.
                      </p>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Comprar Declarações Extras */}
           {(
            <TabsContent value="extras" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Comprar Declarações Extras</CardTitle>
                        <p className="text-sm text-muted-foreground">
                         {isFree ? 'Faça upgrade para Pro para comprar extras' : 'Adicione mais declarações ao seu escritório'}
                        </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Quantidade de declarações
                        </label>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                          >
                            -
                          </Button>
                          <div className="flex-1 text-center">
                            <p className="text-3xl font-bold">{quantidade}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setQuantidade(quantidade + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Valor unitário:</span>
                          <span className="font-medium">R$ 9,90</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Quantidade:</span>
                          <span className="font-medium">{quantidade}</span>
                        </div>
                        <div className="pt-2 border-t flex justify-between">
                          <span className="font-semibold">Total:</span>
                          <span className="text-xl font-bold text-accent">
                            R$ {(quantidade * 9.9).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-center">
                      <Button
                        size="lg"
                        onClick={() => comprarDeclaracao.mutate(quantidade)}
                        disabled={comprarDeclaracao.isPending}
                      >
                        {comprarDeclaracao.isPending ? 'Processando...' : 'Comprar Agora'}
                      </Button>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Declarações extras são válidas por 30 dias e não acumulam. O pagamento será processado via cartão de crédito.
                        </AlertDescription>
                      </Alert>

                      <div className="pt-4 border-t">
                         <p className="text-sm text-muted-foreground text-center">
                           💡 <strong>Dica:</strong> Cada declaração extra custa R$ 9,90 e é válida por 30 dias
                         </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
           )}

          {/* Addons */}
          <TabsContent value="addons" className="mt-6">
            <AddonsMarketplace />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
