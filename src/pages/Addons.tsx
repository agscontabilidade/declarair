import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PlanGate } from '@/components/billing/BillingGate';
import { useAddons, useToggleAddon } from '@/hooks/useAddons';
import { useDeclaracoesExtras } from '@/hooks/useDeclaracoesExtras';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Brain, ShieldCheck, Palette, Zap, Check, Loader2, ShoppingCart, FileText } from 'lucide-react';
import { formatarPreco, PRECOS } from '@/lib/constants/planos';
import { formatCurrency } from '@/lib/formatters';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Brain,
  ShieldCheck,
  Palette,
  Zap,
};

const BENEFIT_MAP: Record<string, string[]> = {
  'WhatsApp Integrado': [
    'Notificações automáticas no WhatsApp',
    'Chat integrado com Evolution API',
    'Templates personalizáveis',
    'Histórico completo de mensagens',
  ],
  'API Pública': [
    'API REST completa',
    'Webhooks configuráveis',
    'Documentação interativa',
    '10.000 requisições/mês',
  ],
  'Portal do Cliente Completo': [
    'Wizard guiado de preenchimento',
    'Upload ilimitado de documentos',
    'Chat em tempo real',
    'Acompanhamento detalhado',
  ],
  'White-label Avançado': [
    'Logo personalizada',
    'Cores da sua marca',
    'Domínio personalizado',
    'Emails com sua identidade',
  ],
};

const PACOTES = [
  { qtd: 5, desconto: 0, label: null },
  { qtd: 10, desconto: 0.10, label: 'Mais Popular' },
  { qtd: 20, desconto: 0.15, label: 'Melhor Custo' },
];

export default function Addons() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'declaracoes' ? 'declaracoes' : 'addons';

  const { catalog, myAddons, isLoading } = useAddons();
  const toggle = useToggleAddon();
  const { comprarDeclaracao } = useDeclaracoesExtras();

  const [confirmAddon, setConfirmAddon] = useState<{ id: string; nome: string; preco: number; isActive: boolean } | null>(null);

  function getAddonStatus(addonId: string) {
    const found = myAddons.find((a) => a.addon_id === addonId);
    return found?.status ?? null;
  }

  const totalAtivos = myAddons.filter((a) => a.status === 'ativo').length;
  const custoMensal = catalog
    .filter((a) => myAddons.some((m) => m.addon_id === a.id && m.status === 'ativo'))
    .reduce((sum, a) => sum + a.preco, 0);

  function handleToggleClick(addon: { id: string; nome: string; preco: number }, isActive: boolean) {
    setConfirmAddon({ id: addon.id, nome: addon.nome, preco: addon.preco, isActive });
  }

  function handleConfirm() {
    if (!confirmAddon) return;
    const realStatus = getAddonStatus(confirmAddon.id);
    toggle.mutate(
      { addonId: confirmAddon.id, currentStatus: realStatus },
      { onSettled: () => setConfirmAddon(null) }
    );
  }

  function handleComprarExtras(qtd: number) {
    comprarDeclaracao.mutate(qtd);
  }

  return (
    <DashboardLayout>
      <PlanGate requiredPlan="pro" featureName="Recursos Extras">
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recursos Extras</h1>
          <p className="text-muted-foreground mt-1">
            Potencialize sua operação com módulos extras e declarações sob demanda.
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="addons">Addons</TabsTrigger>
            <TabsTrigger value="declaracoes">Declarações Extras</TabsTrigger>
          </TabsList>

          {/* ── ADDONS TAB ── */}
          <TabsContent value="addons" className="space-y-6">
            {totalAtivos > 0 && (
              <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Você tem <span className="font-semibold text-foreground">{totalAtivos} recurso{totalAtivos > 1 ? 's' : ''}</span> ativo{totalAtivos > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Custo adicional: <span className="font-semibold text-foreground">{formatCurrency(custoMensal)}/mês</span>
                  </p>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {catalog.map((addon) => {
                  const status = getAddonStatus(addon.id);
                  const isActive = status === 'ativo';
                  const Icon = ICON_MAP[addon.icone] || Zap;
                  const benefits = BENEFIT_MAP[addon.nome] || [];

                  return (
                    <Card
                      key={addon.id}
                      className={`relative overflow-hidden transition-all ${isActive ? 'border-primary/40 shadow-md' : 'hover:shadow-sm'}`}
                    >
                      {isActive && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <Check className="h-3 w-3 mr-1" /> Ativo
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                            <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{addon.nome}</CardTitle>
                            <p className="text-lg font-bold text-foreground mt-0.5">
                              {formatCurrency(addon.preco)}<span className="text-xs font-normal text-muted-foreground">/mês</span>
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pb-3">
                        <CardDescription className="mb-3">{addon.descricao}</CardDescription>
                        {benefits.length > 0 && (
                          <ul className="space-y-1.5">
                            {benefits.map((b, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>

                      <CardFooter>
                        <Button
                          className="w-full"
                          variant={isActive ? 'outline' : 'default'}
                          disabled={toggle.isPending}
                          onClick={() => handleToggleClick(addon, isActive)}
                        >
                          {toggle.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isActive ? (
                            'Desativar'
                          ) : (
                            'Ativar recurso'
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── DECLARAÇÕES EXTRAS TAB ── */}
          <TabsContent value="declaracoes" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Comprar Declarações Extras</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Cada declaração extra custa {formatarPreco(PRECOS.DECLARACAO_EXTRA.preco)}.
                Compre pacotes e use quando precisar.
              </p>

              <div className="grid md:grid-cols-3 gap-4">
                {PACOTES.map((pacote) => {
                  const precoUnitario = PRECOS.DECLARACAO_EXTRA.preco;
                  const precoOriginal = precoUnitario * pacote.qtd;
                  const precoFinal = precoOriginal * (1 - pacote.desconto);

                  return (
                    <Card
                      key={pacote.qtd}
                      className={`p-6 hover:shadow-lg transition-all ${pacote.desconto === 0.10 ? 'border-primary ring-1 ring-primary/20' : ''}`}
                    >
                      <div className="text-center mb-4">
                        {pacote.label && (
                          <Badge className="mb-2" variant={pacote.desconto === 0.10 ? 'default' : 'secondary'}>
                            {pacote.label}
                          </Badge>
                        )}
                        <p className="text-4xl font-bold mb-2">{pacote.qtd}</p>
                        <p className="text-muted-foreground">declarações</p>
                      </div>
                      <div className="text-center mb-4">
                        <p className="text-3xl font-bold text-primary">
                          {formatarPreco(precoFinal)}
                        </p>
                        {pacote.desconto > 0 && (
                          <>
                            <p className="text-sm text-green-600 font-medium">
                              {Math.round(pacote.desconto * 100)}% de desconto
                            </p>
                            <p className="text-xs text-muted-foreground line-through">
                              {formatarPreco(precoOriginal)}
                            </p>
                          </>
                        )}
                        {pacote.desconto === 0 && (
                          <p className="text-sm text-muted-foreground">
                            {formatarPreco(precoUnitario)} cada
                          </p>
                        )}
                      </div>
                      <Button
                        className="w-full gap-2"
                        disabled={comprarDeclaracao.isPending}
                        onClick={() => handleComprarExtras(pacote.qtd)}
                      >
                        {comprarDeclaracao.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4" />
                            Comprar {pacote.qtd} Declarações
                          </>
                        )}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={!!confirmAddon} onOpenChange={(v) => { if (!v) setConfirmAddon(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAddon?.isActive ? 'Desativar recurso' : 'Ativar recurso'}
            </DialogTitle>
            <DialogDescription>
              {confirmAddon?.isActive
                ? `Deseja desativar "${confirmAddon?.nome}"? O valor de ${formatCurrency(confirmAddon?.preco ?? 0)}/mês será removido da sua próxima fatura.`
                : `Ao ativar "${confirmAddon?.nome}", será cobrado ${formatCurrency(confirmAddon?.preco ?? 0)}/mês na sua próxima fatura. O recurso ficará disponível imediatamente.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmAddon(null)}>Cancelar</Button>
            <Button
              variant={confirmAddon?.isActive ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={toggle.isPending}
            >
              {toggle.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmAddon?.isActive ? 'Desativar' : 'Confirmar ativação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
