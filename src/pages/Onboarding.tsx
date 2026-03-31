import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { buscarCNPJ, buscarCEP } from '@/lib/apiBrasil';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import {
  FileText, ArrowRight, ArrowLeft, Upload, User, Building2, Palette,
  CheckCircle2, Phone, Mail, MapPin, Camera
} from 'lucide-react';

const STEPS = ['Bem-vindo', 'Seu Perfil', 'Dados da Empresa', 'Identidade Visual'];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 2: Profile
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 3: Company
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [emailEmpresa, setEmailEmpresa] = useState('');
  const [telefoneEmpresa, setTelefoneEmpresa] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 4: Visual
  const [corPrimaria, setCorPrimaria] = useState('#1E3A5F');

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  function formatCnpj(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  const [buscandoCnpj, setBuscandoCnpj] = useState(false);

  async function handleBuscarCnpj() {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return;
    setBuscandoCnpj(true);
    const dados = await buscarCNPJ(clean);
    if (dados) {
      setRazaoSocial(dados.razao_social || '');
      if (dados.nome_fantasia) setNomeFantasia(dados.nome_fantasia);
      if (dados.email) setEmailEmpresa(dados.email);
      if (dados.ddd_telefone_1) setTelefoneEmpresa(dados.ddd_telefone_1);
      if (dados.cep) setCep(dados.cep);
      if (dados.logradouro) setLogradouro(dados.logradouro);
      if (dados.numero) setNumero(dados.numero);
      if (dados.complemento) setComplemento(dados.complemento);
      if (dados.bairro) setBairro(dados.bairro);
      if (dados.municipio) setCidade(dados.municipio);
      if (dados.uf) setUf(dados.uf);
      toast({ title: 'Dados do CNPJ preenchidos automaticamente!' });
    }
    setBuscandoCnpj(false);
  }

  async function buscarCep() {
    const dados = await buscarCEP(cep);
    if (dados) {
      setLogradouro(dados.logradouro || '');
      setBairro(dados.bairro || '');
      setCidade(dados.localidade || '');
      setUf(dados.uf || '');
    }
  }

  function handleStep3Next() {
    if (!razaoSocial.trim()) {
      toast({ title: 'Razão Social é obrigatória', description: 'Preencha a razão social para continuar.', variant: 'destructive' });
      return;
    }
    if (!cnpj.trim() || cnpj.replace(/\D/g, '').length < 14) {
      toast({ title: 'CNPJ é obrigatório', description: 'Informe um CNPJ válido com 14 dígitos.', variant: 'destructive' });
      return;
    }
    setStep(3);
  }

  async function handleConcluir() {
    if (!profile.escritorioId) return;
    setLoading(true);
    try {
      // Upload avatar
      let avatarUrl: string | null = null;
      if (avatarFile && user) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${user.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('documentos-clientes').upload(path, avatarFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('documentos-clientes').getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      // Upload logo
      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `logos/${profile.escritorioId}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('documentos-clientes').upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('documentos-clientes').getPublicUrl(path);
          logoUrl = urlData.publicUrl;
        }
      }

      // Update avatar on usuarios
      if (avatarUrl && user) {
        await supabase.from('usuarios').update({ avatar_url: avatarUrl }).eq('id', user.id);
      }

      // Update escritorio
      await supabase.from('escritorios').update({
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia || null,
        cnpj: cnpj.replace(/\D/g, ''),
        email: emailEmpresa || null,
        telefone: telefoneEmpresa || null,
        whatsapp: whatsapp || null,
        chave_pix: chavePix || null,
        endereco_cep: cep || null,
        endereco_logradouro: logradouro || null,
        endereco_numero: numero || null,
        endereco_complemento: complemento || null,
        endereco_bairro: bairro || null,
        endereco_cidade: cidade || null,
        endereco_uf: uf || null,
        cor_primaria: corPrimaria,
        logo_url: logoUrl || undefined,
        onboarding_completo: true,
      }).eq('id', profile.escritorioId);

      toast({ title: 'Configuração concluída!', description: 'Bem-vindo ao DeclaraIR!' });
      // Force full reload so AuthContext picks up onboarding_completo = true
      window.location.href = '/dashboard';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logoFull} alt="DeclaraIR" className="h-9" />
          <span className="text-muted-foreground text-sm ml-2">· Configuração Inicial</span>
        </div>
        <span className="text-sm text-muted-foreground">Passo {step + 1} de {STEPS.length}</span>
      </header>

      <Progress value={progress} className="h-1 rounded-none" />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-8 animate-in fade-in duration-300">
              <div className="mx-auto h-20 w-20 rounded-2xl bg-accent/10 flex items-center justify-center">
                <FileText className="h-10 w-10 text-accent" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">
                  Bem-vindo, {profile.nome?.split(' ')[0] || 'Contador'}! 👋
                </h1>
                <p className="text-muted-foreground mt-3 text-lg max-w-md mx-auto">
                  Vamos configurar seu escritório em 3 passos rápidos para você começar a usar o DeclaraIR.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                {[
                  { icon: User, label: 'Seu Perfil' },
                  { icon: Building2, label: 'Empresa' },
                  { icon: Palette, label: 'Visual' },
                ].map((item, i) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border">
                    <item.icon className="h-6 w-6 text-accent" />
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
              <Button size="lg" className="h-12 px-10" onClick={() => setStep(1)}>
                Vamos Começar <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 1: Avatar */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold text-foreground">Seu Perfil</h1>
                <p className="text-muted-foreground mt-1">Adicione uma foto para personalizar sua conta</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <label className="cursor-pointer group">
                  <div className={`h-32 w-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${avatarPreview ? 'border-accent' : 'border-border group-hover:border-accent/60'}`}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <Camera className="h-8 w-8 text-muted-foreground group-hover:text-accent transition-colors" />
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
                <p className="text-sm text-muted-foreground">Clique para subir uma foto (opcional)</p>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button className="flex-1 h-11" onClick={() => setStep(2)}>
                  {avatarPreview ? 'Continuar' : 'Pular'} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Company Data */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold text-foreground">Dados da Empresa</h1>
                <p className="text-muted-foreground mt-1">Campos com * são obrigatórios</p>
              </div>

              {/* Logo */}
              <div className="flex items-center gap-4">
                <label className="cursor-pointer group shrink-0">
                  <div className={`h-16 w-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden ${logoPreview ? 'border-accent' : 'border-border group-hover:border-accent/60'}`}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-1" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
                <div>
                  <p className="text-sm font-medium text-foreground">Logo do Escritório</p>
                  <p className="text-xs text-muted-foreground">PNG ou JPG, recomendado 200×200px</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>CNPJ *</Label>
                  <div className="relative">
                    <Input value={cnpj} onChange={e => setCnpj(formatCnpj(e.target.value))} onBlur={handleBuscarCnpj} placeholder="00.000.000/0000-00" maxLength={18} disabled={buscandoCnpj} />
                    {buscandoCnpj && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">Buscando...</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Digite o CNPJ para preencher automaticamente</p>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Razão Social *</Label>
                  <Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Contabilidade Silva Ltda" />
                </div>
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} placeholder="ContaSilva" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={emailEmpresa} onChange={e => setEmailEmpresa(e.target.value)} placeholder="contato@escritorio.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={telefoneEmpresa} onChange={e => setTelefoneEmpresa(e.target.value)} placeholder="(11) 3333-4444" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label>Chave PIX</Label>
                  <Input value={chavePix} onChange={e => setChavePix(e.target.value)} placeholder="email, CPF, CNPJ ou aleatória" />
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Endereço
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <Input value={cep} onChange={e => setCep(e.target.value)} onBlur={buscarCep} placeholder="00000-000" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Logradouro</Label>
                    <Input value={logradouro} onChange={e => setLogradouro(e.target.value)} placeholder="Rua das Flores" />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input value={numero} onChange={e => setNumero(e.target.value)} placeholder="123" />
                  </div>
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input value={complemento} onChange={e => setComplemento(e.target.value)} placeholder="Sala 101" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Centro" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Cidade</Label>
                    <Input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="São Paulo" />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input value={uf} onChange={e => setUf(e.target.value)} placeholder="SP" maxLength={2} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button className="flex-1 h-11" onClick={handleStep3Next}>
                  Continuar <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Visual */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold text-foreground">Identidade Visual</h1>
                <p className="text-muted-foreground mt-1">Personalize as cores do portal do seu cliente</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cor Primária</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={corPrimaria}
                      onChange={e => setCorPrimaria(e.target.value)}
                      className="h-10 w-14 rounded-lg border border-border cursor-pointer"
                    />
                    <Input value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)} className="w-32 font-mono text-sm" />
                    <span className="text-sm text-muted-foreground">Usada em botões, links e destaques</span>
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-xl border p-6 space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Preview do Portal</p>
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-8 w-8 object-contain rounded" />
                    ) : (
                      <div className="h-8 w-8 rounded" style={{ backgroundColor: corPrimaria }} />
                    )}
                    <span className="font-display font-bold" style={{ color: corPrimaria }}>
                      {nomeFantasia || razaoSocial || 'Seu Escritório'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: corPrimaria }}>
                      Botão Primário
                    </button>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: corPrimaria, color: corPrimaria }}>
                      Botão Outline
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button className="flex-1 h-11" onClick={handleConcluir} disabled={loading}>
                  {loading ? 'Salvando...' : 'Concluir e Acessar o Dashboard'} <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
