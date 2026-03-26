import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useWhatsAppStatus } from '@/hooks/useWhatsApp';
import { useAddons } from '@/hooks/useAddons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

const ETAPAS_KANBAN = [
  { key: 'aguardando_documentos', label: 'Aguardando Documentos', group: 'Declaração' },
  { key: 'documentacao_recebida', label: 'Documentação Recebida', group: 'Declaração' },
  { key: 'declaracao_pronta', label: 'Declaração Pronta', group: 'Declaração' },
  { key: 'transmitida', label: 'Transmitida', group: 'Declaração' },
  { key: 'pendencias', label: 'Pendências na Declaração', group: 'Pendências' },
  { key: 'cobranca_gerada', label: 'Cobrança Gerada', group: 'Cobranças' },
  { key: 'cobranca_vencida', label: 'Cobrança Vencida / Atrasada', group: 'Cobranças' },
  { key: 'cobranca_paga', label: 'Pagamento Confirmado', group: 'Cobranças' },
  { key: 'documentos_recebidos', label: 'Novos Documentos Recebidos', group: 'Documentos' },
];

interface Props {
  escritorioId: string | null;
  isDono: boolean;
}

export function AutomacoesWhatsAppTab({ escritorioId, isDono }: Props) {
  const { toast } = useToast();
  const { data: whatsappStatus } = useWhatsAppStatus();
  const { myAddons } = useAddons();
  const isConnected = whatsappStatus?.status === 'connected';
  const hasAddon = myAddons.some(
    (a) => a.status === 'ativo' && (a as any).addons?.nome?.toLowerCase().includes('whatsapp')
  );

  const [config, setConfig] = useState<Record<string, { ativo: boolean; templateId: string }>>({});
  const [lembreteAtivo, setLembreteAtivo] = useState(false);
  const [lembreteDias, setLembreteDias] = useState('3');
  const [saving, setSaving] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates-whatsapp', escritorioId],
    queryFn: async () => {
      const { data } = await supabase
        .from('templates_mensagem')
        .select('id, nome')
        .eq('escritorio_id', escritorioId!)
        .eq('canal', 'whatsapp')
        .eq('ativo', true);
      return data || [];
    },
    enabled: !!escritorioId,
  });

  useEffect(() => {
    if (!escritorioId) return;
    loadConfig();
  }, [escritorioId]);

  async function loadConfig() {
    const { data } = await supabase
      .from('configuracoes_escritorio')
      .select('chave, valor')
      .eq('escritorio_id', escritorioId!)
      .like('chave', 'whatsapp_auto_%');

    const cfg: Record<string, { ativo: boolean; templateId: string }> = {};
    ETAPAS_KANBAN.forEach((e) => {
      cfg[e.key] = { ativo: false, templateId: '' };
    });

    (data || []).forEach((d: any) => {
      if (d.chave === 'whatsapp_auto_lembrete_ativo') {
        setLembreteAtivo(d.valor === 'true');
      } else if (d.chave === 'whatsapp_auto_lembrete_dias') {
        setLembreteDias(d.valor || '3');
      } else {
        const match = d.chave.match(/^whatsapp_auto_(.+?)_(ativo|template)$/);
        if (match && cfg[match[1]]) {
          if (match[2] === 'ativo') cfg[match[1]].ativo = d.valor === 'true';
          if (match[2] === 'template') cfg[match[1]].templateId = d.valor || '';
        }
      }
    });

    setConfig(cfg);
  }

  async function handleSave() {
    if (!escritorioId || !isDono) return;
    setSaving(true);

    const entries: { escritorio_id: string; chave: string; valor: string }[] = [];

    Object.entries(config).forEach(([etapa, val]) => {
      entries.push({ escritorio_id: escritorioId, chave: `whatsapp_auto_${etapa}_ativo`, valor: String(val.ativo) });
      entries.push({ escritorio_id: escritorioId, chave: `whatsapp_auto_${etapa}_template`, valor: val.templateId });
    });

    entries.push({ escritorio_id: escritorioId, chave: 'whatsapp_auto_lembrete_ativo', valor: String(lembreteAtivo) });
    entries.push({ escritorio_id: escritorioId, chave: 'whatsapp_auto_lembrete_dias', valor: lembreteDias });

    for (const entry of entries) {
      await supabase
        .from('configuracoes_escritorio')
        .upsert(entry, { onConflict: 'escritorio_id,chave' as any });
    }

    toast({ title: 'Automações salvas com sucesso!' });
    setSaving(false);
  }

  if (!hasAddon) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Ative o recurso <strong>WhatsApp Automático</strong> em <Link to="/addons" className="text-primary underline">Recursos Extras</Link> para configurar automações.</p>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-3">Conecte e escaneie seu WhatsApp primeiro para configurar automações.</p>
          <Button asChild><Link to="/whatsapp">Conectar WhatsApp</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const groups = [...new Set(ETAPAS_KANBAN.map((e) => e.group))];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Automações via WhatsApp
        </CardTitle>
        <p className="text-sm text-muted-foreground">Envie mensagens automáticas quando eventos importantes acontecerem.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {groups.map((group) => (
          <div key={group} className="space-y-3">
            <Label className="text-sm font-semibold text-foreground">{group}</Label>
            {ETAPAS_KANBAN.filter((e) => e.group === group).map((etapa) => (
              <div key={etapa.key} className="flex items-center gap-4 p-3 rounded-lg border bg-card">
                <Switch
                  checked={config[etapa.key]?.ativo ?? false}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      [etapa.key]: { ...prev[etapa.key], ativo: checked },
                    }))
                  }
                  disabled={!isDono}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{etapa.label}</p>
                </div>
                <Select
                  value={config[etapa.key]?.templateId || ''}
                  onValueChange={(val) =>
                    setConfig((prev) => ({
                      ...prev,
                      [etapa.key]: { ...prev[etapa.key], templateId: val },
                    }))
                  }
                  disabled={!isDono || !config[etapa.key]?.ativo}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        ))}

        {/* Document reminder */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-sm font-semibold">Lembrete de documentos pendentes</Label>
          <div className="flex items-center gap-4 p-3 rounded-lg border bg-card">
            <Switch checked={lembreteAtivo} onCheckedChange={setLembreteAtivo} disabled={!isDono} />
            <div className="flex-1">
              <p className="text-sm font-medium">Enviar lembrete automático</p>
              <p className="text-xs text-muted-foreground">Cobra documentos pendentes via WhatsApp</p>
            </div>
            <Select value={lembreteDias} onValueChange={setLembreteDias} disabled={!isDono || !lembreteAtivo}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">A cada 3 dias</SelectItem>
                <SelectItem value="5">A cada 5 dias</SelectItem>
                <SelectItem value="7">A cada 7 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {templates.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum template WhatsApp ativo. <Link to="/mensagens" className="text-primary underline">Crie templates</Link> para usar nas automações.
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={handleSave} disabled={saving || !isDono}>
          {saving ? 'Salvando...' : 'Salvar Automações'}
        </Button>
      </CardContent>
    </Card>
  );
}
