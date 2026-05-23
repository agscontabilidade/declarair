import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Users, CreditCard, Puzzle, Palette, Bell, MessageSquare, Phone, Key, ExternalLink, Mail, Smartphone } from 'lucide-react';
import { buscarCNPJ } from '@/lib/apiBrasil';
import { IntegracoesTab } from '@/components/configuracoes/IntegracoesTab';
import AbaEquipe from '@/components/configuracoes/AbaEquipe';
import { WhitelabelTab } from '@/components/configuracoes/WhitelabelTab';
import { NotificacoesTab } from '@/components/configuracoes/NotificacoesTab';
import { AutomacoesWhatsAppTab } from '@/components/configuracoes/AutomacoesWhatsAppTab';
import { MensagensTab } from '@/components/configuracoes/MensagensTab';
import { FeatureGate, PlanGate } from '@/components/billing/BillingGate';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissoes } from '@/hooks/usePermissoes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Configuracoes() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'escritorio');
  const { isDono, podeAlterarEscritorio, podeGerenciarUsuarios } = usePermissoes();
  const escritorioId = profile.escritorioId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Redirect old "automacoes" tab to consolidated "mensagens" (WhatsApp) tab
    if (tabParam === 'automacoes') {
      setSearchParams({ tab: 'mensagens' });
      setActiveTab('mensagens');
      return;
    }
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab, setSearchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const { data: escritorio, isLoading: loadingEsc } = useQuery({
    queryKey: ['escritorio', escritorioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('escritorios').select('*').eq('id', escritorioId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!escritorioId,
  });

  const { data: usuarios, isLoading: loadingUsers } = useQuery({
    queryKey: ['contadores', escritorioId],
    queryFn: async () => {
      const { data } = await supabase.from('usuarios').select('*').eq('escritorio_id', escritorioId!);
      return data || [];
    },
    enabled: !!escritorioId,
  });

  const currentYear = new Date().getFullYear();
  const { data: declCount } = useQuery({
    queryKey: ['decl-count', escritorioId, currentYear],
    queryFn: async () => {
      const { count } = await supabase.from('declaracoes').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId!).eq('ano_base', currentYear);
      return count ?? 0;
    },
    enabled: !!escritorioId,
  });

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cnpj: '',
    responsavelNome: '',
    responsavelCpf: '',
    responsavelCrc: '',
    chavePixTipo: 'aleatoria' as 'cpf_cnpj' | 'email' | 'telefone' | 'aleatoria',
    chavePix: '',
  });

  const setFormField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
  const [saving, setSaving] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);

  function formatCnpj(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  function inferTipoPix(chave: string): 'cpf_cnpj' | 'email' | 'telefone' | 'aleatoria' {
    if (!chave) return 'aleatoria';
    if (chave.includes('@')) return 'email';
    const digits = chave.replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 14) return 'cpf_cnpj';
    if (digits.length >= 10 && digits.length <= 13 && chave.match(/^[+\d\s()\-]+$/)) return 'telefone';
    return 'aleatoria';
  }

  async function handleBuscarCnpj() {
    const clean = form.cnpj.replace(/\D/g, '');
    if (clean.length !== 14 || !podeAlterarEscritorio) return;
    setBuscandoCnpj(true);
    const dados = await buscarCNPJ(clean);
    if (dados) {
      if (!form.nome && dados.razao_social) setFormField('nome', dados.razao_social);
      if (!form.email && dados.email) setFormField('email', dados.email);
      if (!form.telefone && dados.ddd_telefone_1) setFormField('telefone', dados.ddd_telefone_1);
      toast({ title: 'Dados do CNPJ preenchidos automaticamente!' });
    }
    setBuscandoCnpj(false);
  }

  useEffect(() => {
    if (escritorio) {
      setForm({
        nome: escritorio.nome || '',
        email: escritorio.email || '',
        telefone: escritorio.telefone || '',
        cnpj: escritorio.cnpj || '',
        responsavelNome: escritorio.responsavel_nome || '',
        responsavelCpf: escritorio.responsavel_cpf || '',
        responsavelCrc: escritorio.responsavel_crc || '',
        chavePix: escritorio.chave_pix || '',
        chavePixTipo: inferTipoPix(escritorio.chave_pix || ''),
      });
    }
  }, [escritorio]);

  async function handleSave() {
    if (!escritorioId || !podeAlterarEscritorio) return;
    setSaving(true);
    const payload: {
      nome: string; email: string; telefone: string; cnpj: string;
      responsavel_nome: string; responsavel_cpf: string; responsavel_crc: string;
      chave_pix?: string;
    } = {
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      cnpj: form.cnpj,
      responsavel_nome: form.responsavelNome,
      responsavel_cpf: form.responsavelCpf,
      responsavel_crc: form.responsavelCrc,
    };
    if (isDono) payload.chave_pix = form.chavePix;
    const { error } = await supabase.from('escritorios').update(payload).eq('id', escritorioId);

    if (error) toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Dados salvos com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['escritorio', escritorioId] });
    }
    setSaving(false);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="escritorio" className="gap-2"><Settings className="h-4 w-4" /> Escritório</TabsTrigger>
            <TabsTrigger value="usuarios" className="gap-2"><Users className="h-4 w-4" /> Usuários</TabsTrigger>
            <TabsTrigger value="marca" className="gap-2"><Palette className="h-4 w-4" /> Marca</TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2"><Bell className="h-4 w-4" /> Notificações</TabsTrigger>
            <TabsTrigger value="mensagens" className="gap-2"><Smartphone className="h-4 w-4" /> WhatsApp</TabsTrigger>
            <TabsTrigger value="plano" className="gap-2"><CreditCard className="h-4 w-4" /> Plano</TabsTrigger>
            <TabsTrigger value="integracoes" className="gap-2"><Puzzle className="h-4 w-4" /> Integrações</TabsTrigger>
          </TabsList>

          <TabsContent value="escritorio">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-lg">Dados do Escritório</CardTitle></CardHeader>
              <CardContent>
                {loadingEsc ? (
                  <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : (
                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setFormField('nome', e.target.value)} readOnly={!podeAlterarEscritorio} /></div>
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setFormField('email', e.target.value)} readOnly={!podeAlterarEscritorio} /></div>
                    <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setFormField('telefone', e.target.value)} readOnly={!podeAlterarEscritorio} /></div>
                    <div className="space-y-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setFormField('cnpj', formatCnpj(e.target.value))} onBlur={handleBuscarCnpj} readOnly={!podeAlterarEscritorio} disabled={buscandoCnpj} placeholder="00.000.000/0000-00" maxLength={18} /></div>
                    
                    <div className="pt-4 border-t">
                      <h3 className="text-sm font-semibold mb-3">Responsável Técnico</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Nome Completo</Label>
                          <Input value={form.responsavelNome} onChange={e => setFormField('responsavelNome', e.target.value)} readOnly={!podeAlterarEscritorio} placeholder="Nome do contador responsável" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>CPF</Label>
                            <Input value={form.responsavelCpf} onChange={e => setFormField('responsavelCpf', formatCpf(e.target.value))} readOnly={!podeAlterarEscritorio} placeholder="000.000.000-00" maxLength={14} />
                          </div>
                          <div className="space-y-2">
                            <Label>CRC</Label>
                            <Input value={form.responsavelCrc} onChange={e => setFormField('responsavelCrc', e.target.value)} readOnly={!podeAlterarEscritorio} placeholder="Ex: SP-000000/O" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {!podeAlterarEscritorio && <p className="text-sm text-muted-foreground">Você não tem permissão para alterar os dados do escritório.</p>}
                    <Button onClick={handleSave} disabled={saving || !podeAlterarEscritorio} className="w-full sm:w-auto">{saving ? 'Salvando...' : 'Salvar Alterações'}</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios">
            <AbaEquipe escritorioId={escritorioId} isDono={podeGerenciarUsuarios} usuarios={usuarios} loadingUsers={loadingUsers} />
          </TabsContent>

          <TabsContent value="marca">
            <PlanGate requiredPlan="pro" featureName="Marca & Whitelabel">
              <FeatureGate feature="whitelabel">
                {escritorioId && <WhitelabelTab escritorioId={escritorioId} isDono={isDono} />}
              </FeatureGate>
            </PlanGate>
          </TabsContent>

          <TabsContent value="notificacoes">
            <NotificacoesTab escritorioId={escritorioId} isDono={isDono} />
          </TabsContent>

          <TabsContent value="mensagens">
            <MensagensTab />
          </TabsContent>

          {/* Automações foram movidas para dentro da aba WhatsApp como sub-aba */}

          <TabsContent value="plano">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Plano Atual</CardTitle>
                  {isDono && <Button size="sm" onClick={() => navigate('/meus-planos')}>Upgrade</Button>}
                </div>
              </CardHeader>
              <CardContent>
                {loadingEsc ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/10 text-primary text-sm px-3 py-1">{escritorio?.plano === 'gratuito' ? 'Gratuito' : escritorio?.plano ?? 'Gratuito'}</Badge>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Declarações no ano {currentYear}</p>
                      <p className="text-2xl font-bold text-foreground">{declCount ?? 0} <span className="text-sm font-normal text-muted-foreground">de {escritorio?.limite_declaracoes ?? 10}</span></p>
                      <div className="mt-2 h-2 bg-muted-foreground/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, ((declCount ?? 0) / (escritorio?.limite_declaracoes ?? 10)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracoes">
            <div className="space-y-6">
              <IntegracoesTab escritorioId={escritorioId} isDono={isDono} />
              
              <PlanGate requiredPlan="pro" featureName="API Pública">
                <FeatureGate feature="api_publica">
                  <Card className="shadow-sm border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Key className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">API Pública & Chaves de Acesso</CardTitle>
                          <CardDescription>Gerencie suas chaves para integração com sistemas externos</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground flex-1">
                          Sua API permite que outros softwares se conectem ao DeclaraIR para sincronizar clientes, declarações e cobranças.
                        </p>
                        <Button asChild variant="outline" className="gap-2 whitespace-nowrap">
                          <Link to="/api-keys">
                            Gerenciar Chaves <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </FeatureGate>
              </PlanGate>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
