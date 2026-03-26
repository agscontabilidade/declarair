import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAddons, useToggleAddon } from '@/hooks/useAddons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Brain, ShieldCheck, Palette, Zap, Check, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Brain,
  ShieldCheck,
  Palette,
  Zap,
};

const BENEFIT_MAP: Record<string, string[]> = {
  'WhatsApp Automático': [
    'Lembretes automáticos de documentos pendentes',
    'Notificação de status da declaração',
    'Cobrança automatizada via WhatsApp',
  ],
  'IA Inteligente': [
    'Análise automática de inconsistências fiscais',
    'Sugestões inteligentes de deduções',
    'Redução de erros e retrabalho',
  ],
  'Monitoramento de Malha Fina': [
    'Consulta automática junto à Receita Federal',
    'Alertas em tempo real de pendências',
    'Relatórios de situação por cliente',
  ],
  'White-label Avançado': [
    'Portal 100% com sua marca',
    'Domínio personalizado',
    'E-mails e comunicações com sua identidade',
  ],
};

export default function Addons() {
  const { catalog, myAddons, isLoading } = useAddons();
  const toggle = useToggleAddon();

  function getAddonStatus(addonId: string) {
    const found = myAddons.find((a) => a.addon_id === addonId);
    return found?.status ?? null;
  }

  const totalAtivos = myAddons.filter((a) => a.status === 'ativo').length;
  const custoMensal = catalog
    .filter((a) => myAddons.some((m) => m.addon_id === a.id && m.status === 'ativo'))
    .reduce((sum, a) => sum + a.preco, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add-ons</h1>
          <p className="text-muted-foreground mt-1">
            Potencialize sua operação com módulos extras. Ative e desative quando quiser.
          </p>
        </div>

        {/* Summary */}
        {totalAtivos > 0 && (
          <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Você tem <span className="font-semibold text-foreground">{totalAtivos} add-on{totalAtivos > 1 ? 's' : ''}</span> ativo{totalAtivos > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                Custo adicional: <span className="font-semibold text-foreground">{formatCurrency(custoMensal)}/mês</span>
              </p>
            </div>
          </div>
        )}

        {/* Grid */}
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
                      onClick={() => toggle.mutate({ addonId: addon.id, currentStatus: status })}
                    >
                      {toggle.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isActive ? (
                        'Desativar'
                      ) : (
                        'Ativar add-on'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
