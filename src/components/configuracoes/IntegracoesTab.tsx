import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Eye, EyeOff, Upload, Check, X, Shield, HelpCircle, RefreshCw, CheckCircle2, XCircle, ExternalLink, Unlink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BANCOS = [
  { key: 'nenhum', nome: 'Nenhum (controle manual)', desc: 'Registre cobranças e marque como pagas manualmente', available: true },
  { key: 'inter', nome: 'Banco Inter', desc: 'Boleto híbrido (código de barras + PIX QR Code)', available: true },
  { key: 'cora', nome: 'Banco Cora', desc: 'Boleto + PIX para conta PJ', available: false },
  { key: 'conta_azul', nome: 'Conta Azul', desc: 'Gestão financeira + Cobranças', available: true },
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
      const { data } = await supabase
        .from('configuracoes_escritorio')
        .select('chave, valor')
        .eq('escritorio_id', escritorioId);
      const map: Record<string, string> = {};
      (data || []).forEach((c) => { map[c.chave] = c.valor || ''; });
      return map;
    },
    enabled: !!escritorioId,
  });

  const [bancoAtivo, setBancoAtivo] = useState('nenhum');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [chavePix, setChavePix] = useState('');
  const [ambiente, setAmbiente] = useState(false);
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
    const { error } = await supabase
      .from('configuracoes_escritorio')
      .upsert(
        { escritorio_id: escritorioId, chave: key, valor: value },
        { onConflict: 'escritorio_id,chave' } as Record<string, unknown>
      );
    if (error) throw error;
  };

  const handleSave = async () => {
    if (!escritorioId || !isDono) return;
    setSaving(true);
    try {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar configuração';
      toast.error(message);
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
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Gateway de Cobranças</CardTitle>
            {statusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Selecione o banco para emissão automática de boletos e cobranças PIX.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

      {bancoAtivo === 'conta_azul' && (
        <ContaAzulSection escritorioId={escritorioId} isDono={isDono} />
      )}
    </div>
  );
}

/* ── Conta Azul sub-component ── */

function ContaAzulSection({ escritorioId, isDono }: { escritorioId: string | null | undefined; isDono: boolean }) {
  const queryClient = useQueryClient();
  const [caClientId, setCaClientId] = useState('');
  const [caClientSecret, setCaClientSecret] = useState('');
  const [showCaSecret, setShowCaSecret] = useState(false);
  const [savingCa, setSavingCa] = useState(false);

  const { data: caConfig, isLoading: loadingCa } = useQuery({
    queryKey: ['integracao-contaazul', escritorioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integracoes_contaazul' as string)
        .select('*')
        .eq('escritorio_id', escritorioId!)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data as Record<string, unknown> | null;
    },
    enabled: !!escritorioId,
  });

  useEffect(() => {
    if (caConfig) {
      setCaClientId((caConfig.client_id as string) || '');
      setCaClientSecret((caConfig.client_secret_encrypted as string) || '');
    }
  }, [caConfig]);

  const salvarCredenciais = async () => {
    if (!escritorioId || !isDono || !caClientId || !caClientSecret) return;
    setSavingCa(true);
    try {
      const { error } = await supabase.functions.invoke('contaazul-sync', {
        body: {
          acao: 'save_credentials',
          escritorio_id: escritorioId,
          client_id: caClientId,
          client_secret: caClientSecret,
        },
      });
      if (error) throw error;
      toast.success('Credenciais salvas com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['integracao-contaazul', escritorioId] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar credenciais');
    }
    setSavingCa(false);
  };

  const iniciarOAuth = async () => {
    if (!escritorioId) return;
    try {
      const redirectUri = `${window.location.origin}/configuracoes?ca_callback=1`;
      const { data, error } = await supabase.functions.invoke('contaazul-sync', {
        body: {
          acao: 'get_auth_url',
          escritorio_id: escritorioId,
          redirect_uri: redirectUri,
        },
      });
      if (error) throw error;
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao iniciar autorização');
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const isCallback = params.get('ca_callback');
    if (code && isCallback && escritorioId) {
      const redirectUri = `${window.location.origin}/configuracoes?ca_callback=1`;
      supabase.functions.invoke('contaazul-sync', {
        body: {
          acao: 'exchange_code',
          escritorio_id: escritorioId,
          code,
          redirect_uri: redirectUri,
        },
      }).then(({ error }) => {
        if (error) {
          toast.error('Erro ao autorizar Conta Azul');
        } else {
          toast.success('Conta Azul conectada com sucesso!');
          queryClient.invalidateQueries({ queryKey: ['integracao-contaazul', escritorioId] });
        }
        // Clean URL
        window.history.replaceState({}, '', '/configuracoes');
      });
    }
  }, [escritorioId]);

  const sincronizar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('contaazul-sync', {
        body: {
          acao: 'sincronizar_clientes',
          escritorio_id: escritorioId,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${data.importados} clientes importados, ${data.atualizados} atualizados`);
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['integracao-contaazul', escritorioId] });
    },
    onError: (error: Error) => {
      toast.error('Erro na sincronização', { description: error.message });
    },
  });

  const desconectar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('contaazul-sync', {
        body: { acao: 'desconectar', escritorio_id: escritorioId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conta Azul desconectada');
      queryClient.invalidateQueries({ queryKey: ['integracao-contaazul', escritorioId] });
    },
  });

  const isConectado = caConfig?.ativo === true;

  if (loadingCa) {
    return <Card className="shadow-sm"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Integração — Conta Azul</CardTitle>
          {isConectado ? (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Conectado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <XCircle className="mr-1 h-3 w-3" /> Desconectado
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Sincronize clientes e cobranças automaticamente com o Conta Azul.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {!isDono && (
          <p className="text-sm bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 p-3 rounded-lg">
            Apenas o dono do escritório pode alterar as configurações de integração.
          </p>
        )}

        {!isConectado ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client ID *</Label>
                <Input
                  value={caClientId}
                  onChange={e => setCaClientId(e.target.value)}
                  placeholder="Cole seu Client ID do Conta Azul"
                  readOnly={!isDono}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Secret *</Label>
                <div className="relative">
                  <Input
                    type={showCaSecret ? 'text' : 'password'}
                    value={caClientSecret}
                    onChange={e => setCaClientSecret(e.target.value)}
                    placeholder="Cole seu Client Secret"
                    readOnly={!isDono}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCaSecret(!showCaSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCaSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {isDono && (
              <div className="flex gap-3 pt-2">
                <Button onClick={salvarCredenciais} disabled={savingCa || !caClientId || !caClientSecret}>
                  {savingCa ? 'Salvando...' : 'Salvar Credenciais'}
                </Button>
                {caConfig && (
                  <Button variant="outline" onClick={iniciarOAuth}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Autorizar no Conta Azul
                  </Button>
                )}
              </div>
            )}

            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="guia-ca">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Como configurar</div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-muted-foreground space-y-2 pl-1">
                    <p>1. Acesse o <a href="https://developers.contaazul.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Portal de Desenvolvedores do Conta Azul</a></p>
                    <p>2. Crie um novo aplicativo</p>
                    <p>3. Configure a URL de redirecionamento como: <code className="bg-muted px-1 rounded text-xs">{window.location.origin}/configuracoes?ca_callback=1</code></p>
                    <p>4. Copie o Client ID e Client Secret e cole nos campos acima</p>
                    <p>5. Clique em "Salvar Credenciais" e depois em "Autorizar no Conta Azul"</p>
                    <p>6. Você será redirecionado para o Conta Azul para autorizar o acesso</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
              <div>
                <p className="font-semibold text-foreground">Integração Ativa</p>
                <p className="text-sm text-muted-foreground">
                  Última sincronização:{' '}
                  {caConfig?.ultima_sincronizacao
                    ? new Date(caConfig.ultima_sincronizacao as string).toLocaleString('pt-BR')
                    : 'Nunca'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => sincronizar.mutate()}
                  disabled={sincronizar.isPending}
                  size="sm"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${sincronizar.isPending ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
                {isDono && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Deseja desconectar a integração com o Conta Azul?')) {
                        desconectar.mutate();
                      }
                    }}
                    disabled={desconectar.isPending}
                  >
                    <Unlink className="h-4 w-4 mr-1" /> Desconectar
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground">Clientes</p>
                <p className="text-xs text-muted-foreground">Importação e exportação bidirecional</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground">Cobranças</p>
                <p className="text-xs text-muted-foreground">Sincronização automática</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
