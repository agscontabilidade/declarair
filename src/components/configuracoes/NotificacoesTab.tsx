import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppStatus } from '@/hooks/useWhatsApp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const ETAPAS = [
  { key: 'aguardando_documentos', label: 'Aguardando Documentos', group: 'Declaração' },
  { key: 'documentacao_recebida', label: 'Documentação Recebida', group: 'Declaração' },
  { key: 'declaracao_pronta', label: 'Declaração Pronta', group: 'Declaração' },
  { key: 'transmitida', label: 'Transmitida', group: 'Declaração' },
  { key: 'pendencias', label: 'Pendências na Declaração', group: 'Pendências' },
  { key: 'cobranca_gerada', label: 'Cobrança Gerada', group: 'Cobranças' },
  { key: 'cobranca_vencida', label: 'Cobrança Vencida / Atrasada', group: 'Cobranças' },
  { key: 'cobranca_paga', label: 'Pagamento Confirmado', group: 'Cobranças' },
  { key: 'documentos_recebidos', label: 'Novos Documentos Recebidos', group: 'Documentos' },
  { key: 'cliente_cadastrado', label: 'Novo Cliente Cadastrado', group: 'Clientes' },
];

const BASE_CANAIS = [
  { key: 'notificacao_app', label: 'In-App' },
  { key: 'email_cliente', label: 'Email p/ Cliente' },
  { key: 'email_contador', label: 'Email p/ Contador' },
];

interface Props {
  escritorioId: string | null;
  isDono: boolean;
}

export function NotificacoesTab({ escritorioId, isDono }: Props) {
  const { toast } = useToast();
  const { data: whatsappStatus } = useWhatsAppStatus();
  const isWhatsAppConnected = whatsappStatus?.status === 'connected' && !!whatsappStatus?.phone;
  const CANAIS = isWhatsAppConnected
    ? [...BASE_CANAIS, { key: 'whatsapp', label: 'WhatsApp' }]
    : BASE_CANAIS;
  const [config, setConfig] = useState<Record<string, Record<string, boolean>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!escritorioId) return;
    loadConfig();
  }, [escritorioId]);

  async function loadConfig() {
    const { data } = await supabase
      .from('configuracoes_escritorio')
      .select('chave, valor')
      .eq('escritorio_id', escritorioId!)
      .like('chave', 'notif_%');

    const cfg: Record<string, Record<string, boolean>> = {};
    ETAPAS.forEach(e => {
      cfg[e.key] = {};
      CANAIS.forEach(c => { cfg[e.key][c.key] = true; });
    });

    (data || []).forEach((d) => {
      const parts = d.chave.replace('notif_', '').split('__');
      if (parts.length === 2 && cfg[parts[0]]) {
        cfg[parts[0]][parts[1]] = d.valor === 'true';
      }
    });

    setConfig(cfg);
  }

  function toggle(etapa: string, canal: string) {
    setConfig(prev => ({
      ...prev,
      [etapa]: { ...prev[etapa], [canal]: !prev[etapa]?.[canal] },
    }));
  }

  async function handleSave() {
    if (!escritorioId || !isDono) return;
    setSaving(true);
    const entries = Object.entries(config).flatMap(([etapa, canais]) =>
      Object.entries(canais).map(([canal, ativo]) => ({
        escritorio_id: escritorioId,
        chave: `notif_${etapa}__${canal}`,
        valor: String(ativo),
      }))
    );

    for (const entry of entries) {
      await supabase
        .from('configuracoes_escritorio')
        .upsert(entry, { onConflict: 'escritorio_id,chave' } as Record<string, unknown>);
    }

    toast({ title: 'Configurações de notificação salvas!' });
    setSaving(false);
  }

  const groups = [...new Set(ETAPAS.map(e => e.group))];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent" />
          Notificações por Evento
        </CardTitle>
        <p className="text-sm text-muted-foreground">Configure quais notificações são enviadas em cada evento do sistema.</p>
      </CardHeader>
      <CardContent>
        {!isWhatsAppConnected && (
          <Alert className="mb-4 border-warning/40 bg-warning/10">
            <Info className="h-4 w-4 text-warning-dark" />
            <AlertDescription className="text-sm text-warning-dark">
              O canal WhatsApp será exibido após conectar seu número em <strong>WhatsApp</strong>.
            </AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4 font-medium text-foreground">Evento</th>
                {CANAIS.map(c => (
                  <th key={c.key} className="text-center py-3 px-3 font-medium text-foreground whitespace-nowrap">
                    {c.label}
                    {c.key === 'whatsapp' && (
                      <Badge className="ml-1 bg-emerald-100 text-emerald-800 text-[10px] px-1">ON</Badge>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <>
                  <tr key={`group-${group}`}>
                    <td colSpan={CANAIS.length + 1} className="pt-4 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group}</td>
                  </tr>
                  {ETAPAS.filter(e => e.group === group).map(e => (
                    <tr key={e.key} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-foreground">{e.label}</td>
                      {CANAIS.map(c => (
                        <td key={c.key} className="text-center py-3 px-3">
                          <Switch
                            checked={config[e.key]?.[c.key] ?? true}
                            onCheckedChange={() => toggle(e.key, c.key)}
                            disabled={!isDono}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving || !isDono}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
