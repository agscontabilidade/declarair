import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { UpsellModal } from '@/components/cadastro/UpsellModal';
import {
  FileText, Check, ArrowRight, ArrowLeft, Zap, Crown,
  CheckCircle2, Eye, EyeOff, Pencil
} from 'lucide-react';

const PLANOS = [
  {
    id: 'gratuito', nome: 'Free', preco: 'R$ 0', periodo: '/mês', icon: Zap,
    declaracoes: '1', usuarios: '1',
    features: ['Dashboard Kanban', 'Chat com Clientes', 'Kanban de Declarações', '500 MB de Armazenamento'],
    popular: false,
  },
  {
    id: 'pro', nome: 'Pro', preco: 'R$ 29,90', periodo: '/mês', icon: Crown,
    declaracoes: '3 inclusas', usuarios: '5',
    features: ['Tudo do Free', '3 declarações inclusas + extras por R$ 9,90', 'Storage Ilimitado', 'Malha Fina + Calculadora IR', 'Suporte Prioritário', 'Até 5 Usuários'],
    popular: true,
  },
];

const STEPS = ['Seus Dados', 'Escolha o Plano', 'Revisão'];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              i < currentStep
                ? 'bg-accent border-accent text-accent-foreground'
                : i === currentStep
                ? 'bg-accent border-accent text-accent-foreground scale-110 shadow-lg shadow-accent/30'
                : 'border-border bg-card text-muted-foreground'
            }`}>
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-colors ${i < currentStep ? 'bg-accent' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Cadastro() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  // Step 1
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');

  // Step 2
  const [planoSelecionado, setPlanoSelecionado] = useState('gratuito');
  const [nomeEscritorio, setNomeEscritorio] = useState('');

  function handleStep1Next() {
    if (!nome.trim() || !email.trim() || !senha.trim()) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (senha.length < 6) {
      toast({ title: 'A senha deve ter no mínimo 6 caracteres', variant: 'destructive' });
      return;
    }
    setStep(1);
  }

  function handleStep2Next() {
    if (!nomeEscritorio.trim()) {
      toast({ title: 'Informe o nome do seu escritório', variant: 'destructive' });
      return;
    }
    if (planoSelecionado === 'gratuito') {
      setShowUpsell(true);
      return;
    }
    setStep(2);
  }

  function handleUpsellContinueFree() {
    setShowUpsell(false);
    setStep(2);
  }

  function handleUpsellUpgrade() {
    setShowUpsell(false);
    setPlanoSelecionado('pro');
    setStep(2);
  }

  async function handleCriarConta() {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar conta');

      // Supabase returns a fake user with empty identities when email already exists
      if (authData.user.identities && authData.user.identities.length === 0) {
        throw new Error('already registered');
      }

      const { error: rpcError } = await supabase.rpc('handle_new_accountant_signup', {
        p_user_id: authData.user.id,
        p_nome: nome,
        p_nome_escritorio: nomeEscritorio,
        p_email: email,
      });
      if (rpcError) throw rpcError;

      // Note: telefone and plano updates happen after login when RLS allows it
      // Store them temporarily to apply after session is established
      const pendingUpdates = { telefone: telefone.trim(), plano: planoSelecionado };

      toast({
        title: 'Conta criada com sucesso!',
        description: 'Vamos configurar seu escritório agora.',
      });
      // Se auto-confirm está ativo, sessão já existe → aplicar updates e ir ao onboarding
      // Senão, ir para login para confirmar email primeiro
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        // Apply pending updates now that we have a session
        if (pendingUpdates.telefone) {
          await supabase.from('usuarios').update({ telefone: pendingUpdates.telefone }).eq('id', authData.user.id);
        }
        if (pendingUpdates.plano === 'pro') {
          // Redirect to checkout for Pro plan payment before onboarding
          navigate('/checkout?plano=pro&from=cadastro', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      } else {
        toast({
          title: 'Verifique seu email',
          description: 'Confirme sua conta e depois faça login.',
        });
        navigate('/login');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        toast({
          title: 'Este email já está cadastrado',
          description: 'Faça login com sua conta existente ou use outro email.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Erro ao criar conta', description: msg, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  }

  const planoInfo = PLANOS.find(p => p.id === planoSelecionado)!;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-10 overflow-hidden gradient-brand">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
        <div className="absolute top-20 -right-20 w-72 h-72 rounded-full border border-primary-foreground/10" />
        <div className="absolute bottom-32 -left-16 w-56 h-56 rounded-3xl border border-primary-foreground/10 rotate-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src={logoFull} alt="DeclaraIR" className="h-10 brightness-0 invert" />
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-3xl font-bold text-primary-foreground leading-tight">
            Comece sua jornada<br />na gestão de IRPF
          </h2>
          <p className="text-primary-foreground/70 text-lg leading-relaxed max-w-sm">
            Configure sua conta em minutos e transforme a forma como seu escritório trabalha.
          </p>
          <div className="flex items-center gap-3 text-primary-foreground/60 text-sm">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <span>Comece em 2 minutos</span>
          </div>
        </div>
        <p className="relative z-10 text-primary-foreground/40 text-xs">© {new Date().getFullYear()} DeclaraIR</p>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <img src={logoFull} alt="DeclaraIR" className="h-9" />
          </div>

          <StepIndicator currentStep={step} />

          {/* Step 1: Dados pessoais */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <h1 className="font-display text-2xl font-bold text-foreground">Crie sua conta</h1>
                <p className="text-muted-foreground mt-1">Informe seus dados para começar</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="João Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                <Input id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha *</Label>
                <div className="relative">
                  <Input id="senha" type={showPassword ? 'text' : 'password'} value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button variant="gradient" className="w-full h-11" onClick={handleStep1Next}>
                Continuar <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-accent hover:underline font-medium">Entrar</Link>
              </p>
            </div>
          )}

          {/* Step 2: Plano */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-2">
                <h1 className="font-display text-2xl font-bold text-foreground">Escolha seu plano</h1>
                <p className="text-muted-foreground mt-1">Você pode mudar a qualquer momento</p>
              </div>

              <div className="space-y-2 mb-4">
                <Label htmlFor="nomeEscritorio">Nome do escritório *</Label>
                <Input id="nomeEscritorio" value={nomeEscritorio} onChange={e => setNomeEscritorio(e.target.value)} placeholder="Contabilidade Silva" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PLANOS.map(p => {
                  const Icon = p.icon;
                  const isSelected = planoSelecionado === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlanoSelecionado(p.id)}
                      className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/5 shadow-md'
                          : 'border-border hover:border-accent/40 bg-card'
                      }`}
                    >
                      {p.popular && (
                        <Badge className="absolute -top-2.5 right-2 bg-accent text-accent-foreground text-[10px] px-2">Popular</Badge>
                      )}
                      <Icon className={`h-5 w-5 mb-2 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                      <p className="font-display font-bold text-sm text-foreground">{p.nome}</p>
                      <p className="text-lg font-bold text-foreground mt-1">
                        {p.preco}<span className="text-xs text-muted-foreground font-normal">{p.periodo}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{p.declaracoes} decl. · {p.usuarios} user(s)</p>
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="h-5 w-5 text-accent" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(0)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button variant="gradient" className="flex-1 h-11" onClick={handleStep2Next}>
                  Continuar <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Revisão */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-4">
                <h1 className="font-display text-2xl font-bold text-foreground">Revise seus dados</h1>
                <p className="text-muted-foreground mt-1">Confirme as informações antes de criar sua conta</p>
              </div>

              <Card className="border-border/60">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-foreground">Dados Pessoais</h3>
                    <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-muted-foreground">Nome</p><p className="font-medium text-foreground">{nome}</p></div>
                    <div><p className="text-muted-foreground">Email</p><p className="font-medium text-foreground">{email}</p></div>
                    {telefone && <div><p className="text-muted-foreground">Telefone</p><p className="font-medium text-foreground">{telefone}</p></div>}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-foreground">Plano Selecionado</h3>
                    <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Alterar
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${planoInfo.popular ? 'bg-accent/10' : 'bg-muted'}`}>
                      <planoInfo.icon className={`h-5 w-5 ${planoInfo.popular ? 'text-accent' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-display font-bold text-foreground">{planoInfo.nome}</p>
                      <p className="text-sm text-muted-foreground">{planoInfo.preco}{planoInfo.periodo} · {planoInfo.declaracoes} declarações</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Escritório:</p>
                    <p>{nomeEscritorio}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button variant="gradient" className="flex-1 h-11" onClick={handleCriarConta} disabled={loading}>
                  {loading ? 'Criando...' : planoSelecionado === 'gratuito' ? 'Criar Conta Grátis' : `Assinar ${planoInfo.nome}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UpsellModal
        open={showUpsell}
        onContinueFree={handleUpsellContinueFree}
        onUpgrade={handleUpsellUpgrade}
      />
    </div>
  );
}
