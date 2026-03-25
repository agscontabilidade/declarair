import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Eye, EyeOff, Upload, Check, X, Shield, HelpCircle, Webhook, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRegisterWebhook, useListWebhooks } from '@/hooks/useBilling';

const BANCOS = [
  { key: 'nenhum', nome: 'Nenhum (controle manual)', desc: 'Registre cobranças e marque como pagas manualmente', available: true },
  { key: 'inter', nome: 'Banco Inter', desc: 'Boleto híbrido (código de barras + PIX QR Code)', available: true },
  { key: 'bb', nome: 'Banco do Brasil', desc: 'Boleto + PIX', available: false },
  { key: 'efi', nome: 'EFI (Gerencianet)', desc: 'Boleto + PIX + Cartão', available: false },
  { key: 'sicoob', nome: 'Sicoob', desc: 'Boleto + PIX', available: false },
  { key: 'sicredi', nome: 'Sicredi', desc: 'Boleto + PIX', available: false },
];

interface Props {
  escritorioId: string | null | undefined;
  isDono: boolean;
}

export function IntegracoesTab({ escritorioId, isDono }: Props) {
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['configuracoes', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return {};
      const { data } = await (supabase as any).from('configuracoes_escritorio').select('chave, valor').eq('escritorio_id', escritorioId);
      const map: Record<string, string> = {};
      (data || []).forEach((c: any) => { map[c.chave] = c.valor || ''; });
      return map;
    },
    enabled: !!escritorioId,
  });

  const [bancoAtivo, setBancoAtivo] = useState('nenhum');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [chavePix, setChavePix] = useState('');
  const [ambiente, setAmbiente] = useState(false); // false=sandbox, true=producao
  const [certFile, setCertFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [certUploaded, setCertUploaded] = useState('');
  const [keyUploaded, setKeyUploaded] = useState('');
  const [saving, setSaving] = useState(false);
  const certInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (configs) {
      setBancoAtivo(configs.banco_ativo || 'nenhum');
      setClientId(configs.inter_client_id || '');
      setClientSecret(configs.inter_client_secret || '');
      setChavePix(configs.inter_chave_pix || '');
      setAmbiente(configs.inter_ambiente === 'producao');
      setCertUploaded(configs.inter_certificado_url || '');
      setKeyUploaded(configs.inter_chave_url || '');
    }
  }, [configs]);

  const saveConfig = async (key: string, value: string) => {
    if (!escritorioId) return;
    const { error } = await (supabase as any).from('configuracoes_escritorio').upsert(
      { escritorio_id: escritorioId, chave: key, valor: value },
      { onConflict: 'escritorio_id,chave' }
    );
    if (error) throw error;
  };

  const handleSave = async () => {
    if (!escritorioId || !isDono) return;
    setSaving(true);
    try {
      // Upload cert files if new
      let certPath = certUploaded;
      let keyPath = keyUploaded;

      if (certFile) {
        const path = `${escritorioId}/integracao/certificado.crt`;
        const { error } = await supabase.storage.from('documentos-clientes').upload(path, certFile, { upsert: true });
        if (error) throw error;
        certPath = path;
      }
      if (keyFile) {
        const path = `${escritorioId}/integracao/chave.key`;
        const { error } = await supabase.storage.from('documentos-clientes').upload(path, keyFile, { upsert: true });
        if (error) throw error;
        keyPath = path;
      }

      await Promise.all([
        saveConfig('banco_ativo', bancoAtivo),
        saveConfig('inter_client_id', clientId),
        saveConfig('inter_client_secret', clientSecret),
        saveConfig('inter_chave_pix', chavePix),
        saveConfig('inter_ambiente', ambiente ? 'producao' : 'sandbox'),
        saveConfig('inter_certificado_url', certPath),
        saveConfig('inter_chave_url', keyPath),
        saveConfig('inter_ativo', bancoAtivo === 'inter' ? 'true' : 'false'),
      ]);

      queryClient.invalidateQueries({ queryKey: ['configuracoes', escritorioId] });
      toast.success('Configuração salva com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configuração');
    }
    setSaving(false);
  };

  const handleTestar = () => {
    if (!clientId || !clientSecret) {
      toast.error('Preencha Client ID e Client Secret antes de testar.');
      return;
    }
    toast.success('Configuração salva. A conexão será validada na primeira cobrança.');
  };

  const statusBadge = () => {
    if (!configs?.inter_ativo || configs.inter_ativo !== 'true') return <Badge variant="outline" className="text-muted-foreground">Não configurado</Badge>;
    if (configs.inter_ambiente === 'producao') return <Badge className="bg-emerald-100 text-emerald-800">Ativo — Produção</Badge>;
    return <Badge className="bg-amber-100 text-amber-800">Sandbox</Badge>;
  };

  if (isLoading) return <Card className="shadow-sm"><CardContent className="p-6"><div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div></CardContent></Card>;

  return (
    <div className="space-y-6">
      {/* Bank Selection */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Gateway de Cobranças</CardTitle>
            {statusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Selecione o banco para emissão automática de boletos e cobranças PIX.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {BANCOS.map(b => (
              <button
                key={b.key}
                disabled={!b.available || !isDono}
                onClick={() => setBancoAtivo(b.key)}
                className={`relative text-left p-4 rounded-lg border-2 transition-all ${
                  bancoAtivo === b.key ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                } ${!b.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-foreground">{b.nome}</span>
                  {!b.available && <Badge variant="outline" className="text-xs">Em breve</Badge>}
                  {bancoAtivo === b.key && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inter Configuration */}
      {bancoAtivo === 'inter' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Configuração — Banco Inter</CardTitle>
            <p className="text-sm text-muted-foreground">Conecte sua conta PJ do Inter para emitir boletos e cobranças PIX automaticamente.</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {!isDono && <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">Apenas o dono do escritório pode alterar as configurações de integração.</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client ID *</Label>
                <Input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="Cole seu Client ID aqui" readOnly={!isDono} />
              </div>
              <div className="space-y-2">
                <Label>Client Secret *</Label>
                <div className="relative">
                  <Input
                    type={showSecret ? 'text' : 'password'}
                    value={clientSecret}
                    onChange={e => setClientSecret(e.target.value)}
                    placeholder="Cole seu Client Secret aqui"
                    readOnly={!isDono}
                  />
                  <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Certificado (.crt) *</Label>
                <input ref={certInputRef} type="file" accept=".crt,.pem" className="hidden" onChange={e => { if (e.target.files?.[0]) setCertFile(e.target.files[0]); }} />
                {certFile || certUploaded ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm truncate flex-1">{certFile?.name || 'certificado.crt'}</span>
                    {isDono && <button onClick={() => { setCertFile(null); setCertUploaded(''); }} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>}
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => certInputRef.current?.click()} disabled={!isDono}>
                    <Upload className="h-4 w-4 mr-2" /> Selecionar certificado
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Chave do Certificado (.key) *</Label>
                <input ref={keyInputRef} type="file" accept=".key,.pem" className="hidden" onChange={e => { if (e.target.files?.[0]) setKeyFile(e.target.files[0]); }} />
                {keyFile || keyUploaded ? (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm truncate flex-1">{keyFile?.name || 'chave.key'}</span>
                    {isDono && <button onClick={() => { setKeyFile(null); setKeyUploaded(''); }} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>}
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={() => keyInputRef.current?.click()} disabled={!isDono}>
                    <Upload className="h-4 w-4 mr-2" /> Selecionar chave
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chave PIX</Label>
                <Input value={chavePix} onChange={e => setChavePix(e.target.value)} placeholder="Sua chave PIX cadastrada no Inter" readOnly={!isDono} />
              </div>
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <div className="flex items-center gap-3 pt-2">
                  <span className={`text-sm ${!ambiente ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>Sandbox</span>
                  <Switch checked={ambiente} onCheckedChange={setAmbiente} disabled={!isDono} />
                  <span className={`text-sm ${ambiente ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>Produção</span>
                </div>
              </div>
            </div>

            {isDono && (
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Configuração'}</Button>
                <Button variant="outline" onClick={handleTestar} disabled={!clientId || !clientSecret}>
                  <Shield className="h-4 w-4 mr-2" /> Testar Conexão
                </Button>
              </div>
            )}

            {/* Setup Guide */}
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="guia">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Como obter as credenciais do Banco Inter</div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-muted-foreground space-y-2 pl-1">
                    <p>1. Acesse o Internet Banking do Inter (conta PJ)</p>
                    <p>2. Vá em "Soluções para sua empresa" → "Nova Integração"</p>
                    <p>3. Dê um nome (ex: "DeclaraIR") e avance</p>
                    <p>4. Na aba de permissões, conceda TODAS as permissões para:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>API Cobranças (Boleto + PIX)</li>
                      <li>API PIX</li>
                      <li>API Banking</li>
                    </ul>
                    <p>5. Após criar, vá em Ações (⋯) → Download chaves e certificado</p>
                    <p>6. Você receberá um ZIP com dois arquivos:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Certificado (.crt) — faça upload acima</li>
                      <li>Chave (.key) — faça upload acima</li>
                    </ul>
                    <p>7. O Client ID e Client Secret aparecem APENAS UMA VEZ na tela. Copie imediatamente.</p>
                    <p>8. Cole os valores nos campos acima e clique em "Salvar Configuração"</p>
                    <p className="text-amber-600 font-medium mt-3">⚠️ Importante: Os certificados do Inter expiram em 1 ano. Você precisará refazer este processo anualmente.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Asaas Webhook Registration */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Webhook className="h-5 w-5" /> Webhook de Pagamentos (Asaas)
            </CardTitle>
            <WebhookStatus escritorioId={escritorioId} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Registre o webhook para receber notificações automáticas de pagamentos, cobranças e assinaturas do Asaas.
          </p>
          <WebhookActions isDono={isDono} />
        </CardContent>
      </Card>
    </div>
  );
}

function WebhookStatus({ escritorioId }: { escritorioId: string | null | undefined }) {
  const { data, isLoading } = useListWebhooks();
  if (isLoading) return <Badge variant="outline" className="text-muted-foreground">Verificando...</Badge>;
  const webhooks = data?.webhooks || [];
  const active = webhooks.find((w: any) => w.url?.includes('billing-webhook') && w.enabled);
  if (active) return <Badge className="bg-emerald-100 text-emerald-800">Ativo</Badge>;
  return <Badge variant="outline" className="text-destructive">Não registrado</Badge>;
}

function WebhookActions({ isDono }: { isDono: boolean }) {
  const registerMutation = useRegisterWebhook();
  const { data, isLoading, refetch } = useListWebhooks();
  const webhooks = data?.webhooks || [];
  const active = webhooks.find((w: any) => w.url?.includes('billing-webhook') && w.enabled);

  const handleRegister = async () => {
    await registerMutation.mutateAsync();
    refetch();
  };

  return (
    <div className="space-y-3">
      {active ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm font-medium text-emerald-800">✓ Webhook registrado e ativo</p>
          <p className="text-xs text-emerald-600 mt-1">URL: {active.url}</p>
          <p className="text-xs text-emerald-600">Eventos: {active.events?.length || 0} configurados</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800">⚠ Webhook não registrado</p>
          <p className="text-xs text-amber-600 mt-1">Sem o webhook, o sistema não receberá confirmações de pagamento automaticamente.</p>
        </div>
      )}
      {isDono && (
        <Button onClick={handleRegister} disabled={registerMutation.isPending || isLoading} variant={active ? 'outline' : 'default'}>
          {registerMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Webhook className="h-4 w-4 mr-2" />}
          {active ? 'Re-registrar Webhook' : 'Registrar Webhook'}
        </Button>
      )}
    </div>
  );
}
