import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ETAPAS = [
  { key: 'aguardando_documentos', label: 'Aguardando Documentos' },
  { key: 'documentacao_recebida', label: 'Documentação Recebida' },
  { key: 'declaracao_pronta', label: 'Declaração Pronta' },
  { key: 'transmitida', label: 'Transmitida' },
];

const CANAIS = [
  { key: 'email_cliente', label: 'Email p/ Cliente' },
  { key: 'email_contador', label: 'Email p/ Contador' },
  { key: 'notificacao_app', label: 'Notificação In-App' },
];

interface Props {
  escritorioId: string | null;
  isDono: boolean;
}

export function NotificacoesTab({ escritorioId, isDono }: Props) {
  const { toast } = useToast();
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
      CANAIS.forEach(c => { cfg[e.key][c.key] = true; }); // default on
    });

    (data || []).forEach((d: any) => {
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
        .upsert(entry, { onConflict: 'escritorio_id,chave' as any });
    }

    toast({ title: 'Configurações de notificação salvas!' });
    setSaving(false);
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-accent" />
          Notificações por Etapa
        </CardTitle>
        <p className="text-sm text-muted-foreground">Configure quais notificações são enviadas a cada mudança de status no Kanban.</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4 font-medium text-foreground">Etapa</th>
                {CANAIS.map(c => (
                  <th key={c.key} className="text-center py-3 px-4 font-medium text-foreground">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ETAPAS.map(e => (
                <tr key={e.key} className="border-b last:border-0">
                  <td className="py-3 pr-4 text-foreground">{e.label}</td>
                  {CANAIS.map(c => (
                    <td key={c.key} className="text-center py-3 px-4">
                      <Switch
                        checked={config[e.key]?.[c.key] ?? true}
                        onCheckedChange={() => toggle(e.key, c.key)}
                        disabled={!isDono}
                      />
                    </td>
                  ))}
                </tr>
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
