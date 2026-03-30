import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { MessageCircle, UserCircle, Code, Palette, UserPlus } from 'lucide-react';
import { useBilling } from '@/hooks/useBilling';
import { useAddons, useToggleAddon } from '@/hooks/useAddons';

const ADDONS_CONFIG = [
  {
    keyword: 'whatsapp',
    nome: 'WhatsApp',
    descricao: 'Envie mensagens automáticas e templates personalizados para seus clientes',
    preco: 19.90,
    icon: MessageCircle,
    beneficios: [
      'Templates customizáveis',
      'Envio em massa',
      'Automações inteligentes',
      'Integração nativa',
    ],
  },
  {
    keyword: 'api',
    nome: 'API Pública',
    descricao: 'Integre o DeclaraIR com seus sistemas e ferramentas externas',
    preco: 29.90,
    icon: Code,
    beneficios: [
      'Endpoints REST completos',
      'Documentação técnica',
      'Rate limiting personalizado',
      'Webhooks inclusos',
    ],
  },
  {
    keyword: 'whitelabel',
    nome: 'Whitelabel',
    descricao: 'Personalize com sua marca: logo, cores e domínio próprio',
    preco: 9.90,
    icon: Palette,
    beneficios: [
      'Logo personalizada',
      'Cores customizadas',
      'Domínio próprio',
      'Sem marca DeclaraIR',
    ],
  },
  {
    keyword: 'usuário extra',
    nome: 'Usuário Extra',
    descricao: 'Adicione usuários simultâneos além do limite do seu plano',
    preco: 9.90,
    icon: UserPlus,
    beneficios: [
      'A partir do 6º usuário',
      'Acesso simultâneo',
      'Permissões granulares',
      'Sem limite de addons',
    ],
  },
];

export function AddonsMarketplace() {
  const { hasAddon } = useBilling();
  const { myAddons, catalog } = useAddons();
  const toggleAddon = useToggleAddon();

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Recursos Adicionais</h2>
        <p className="text-muted-foreground">
          Ative apenas os recursos que você precisa e pague somente por isso
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ADDONS_CONFIG.map((addon) => {
          const Icon = addon.icon;
          const isActive = hasAddon(addon.keyword);

          // Find matching addon from DB catalog
          const catalogItem = catalog.find(
            (c) => c.nome.toLowerCase().includes(addon.keyword.toLowerCase())
          );
          const myAddon = myAddons.find(
            (a) => a.addons?.nome?.toLowerCase().includes(addon.keyword.toLowerCase())
          );

          return (
            <Card key={addon.keyword} className="relative flex flex-col">
              {isActive && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge className="bg-emerald-500 text-white">Ativo</Badge>
                </div>
              )}

              <CardHeader>
                <div className="h-12 w-12 mb-3 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg">{addon.nome}</CardTitle>
                <p className="text-sm text-muted-foreground">{addon.descricao}</p>
                <div className="mt-4">
                  <span className="text-2xl font-bold">R$ {addon.preco.toFixed(2)}</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2 flex-1">
                  {addon.beneficios.map((beneficio) => (
                    <div key={beneficio} className="flex items-start gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                      <span>{beneficio}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {isActive ? 'Ativado' : 'Ativar'}
                  </span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => {
                      if (catalogItem) {
                        toggleAddon.mutate({
                          addonId: catalogItem.id,
                          currentStatus: myAddon?.status ?? null,
                        });
                      }
                    }}
                    disabled={toggleAddon.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
