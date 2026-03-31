import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import logoFull from '@/assets/logo-full.png';
import logoIcon from '@/assets/logo-icon.png';

interface ClienteInfo {
  id: string;
  nome: string;
  email: string;
  escritorio_id: string;
}

export default function ConviteCliente() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<ClienteInfo | null>(null);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function fetchCliente() {
      if (!token) return;
      const { data, error } = await supabase.rpc('buscar_cliente_por_token', { _token: token });
      if (error || !data || data.length === 0) {
        toast({ title: 'Convite inválido', description: 'Este convite expirou ou já foi utilizado.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      setCliente(data[0] as ClienteInfo);
      setLoading(false);
    }
    fetchCliente();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== confirmarSenha) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }
    if (senha.length < 6) {
      toast({ title: 'A senha deve ter no mínimo 6 caracteres', variant: 'destructive' });
      return;
    }
    if (!cliente) return;

    setSubmitting(true);
    try {
      // Use edge function to create account with admin API (avoids email confirmation deadlock)
      const { data, error } = await supabase.functions.invoke('register-from-direct-invite', {
        body: { token, senha },
      });

      if (error) throw new Error(error.message || 'Erro ao criar conta');
      if (data?.error) throw new Error(data.error);

      // Auto-login after account creation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cliente.email,
        password: senha,
      });

      if (signInError) {
        toast({ title: 'Conta criada!', description: 'Faça login para acessar o portal.' });
        navigate('/cliente/login');
        return;
      }

      toast({ title: 'Conta criada com sucesso!', description: 'Redirecionando para o portal...' });
      setTimeout(() => navigate('/cliente/dashboard'), 1500);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Validando convite...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex bg-background">
        <div className="hidden lg:flex lg:w-[42%] bg-primary relative flex-col justify-between p-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/30" />
          <div className="absolute top-20 -right-20 w-72 h-72 rounded-full border border-primary-foreground/10" />
          <div className="absolute bottom-32 -left-16 w-56 h-56 rounded-3xl border border-primary-foreground/10 rotate-12" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <img src={logoFull} alt="DeclaraIR" className="h-10 brightness-0 invert" />
            </div>
          </div>
          <div className="relative z-10" />
          <p className="relative z-10 text-primary-foreground/40 text-xs">© {new Date().getFullYear()} DeclaraIR</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md text-center space-y-4">
            <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
              <img src={logoFull} alt="DeclaraIR" className="h-9" />
            </div>
            <h1 className="font-display text-2xl font-bold text-destructive">Convite Inválido</h1>
            <p className="text-muted-foreground">Este link de convite expirou ou já foi utilizado.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-[42%] bg-primary relative flex-col justify-between p-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/30" />
        <div className="absolute top-20 -right-20 w-72 h-72 rounded-full border border-primary-foreground/10" />
        <div className="absolute bottom-32 -left-16 w-56 h-56 rounded-3xl border border-primary-foreground/10 rotate-12" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <img src={logoIcon} alt="DeclaraIR" className="h-11 w-11" />
            <img src={logoFull} alt="DeclaraIR" className="h-8 brightness-0 invert" />
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-3xl font-bold text-primary-foreground leading-tight">
            Bem-vindo ao portal<br />do seu contador
          </h2>
          <p className="text-primary-foreground/70 text-lg leading-relaxed max-w-sm">
            Crie sua conta para acessar documentos, acompanhar declarações e se comunicar com seu contador.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary-foreground/60 text-sm">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>Envio seguro de documentos</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/60 text-sm">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>Acompanhamento em tempo real</span>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-primary-foreground/40 text-xs">© {new Date().getFullYear()} DeclaraIR</p>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <img src={logoIcon} alt="DeclaraIR" className="h-10 w-10" />
            <img src={logoFull} alt="DeclaraIR" className="h-7" />
          </div>

          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Crie sua conta</h1>
              <p className="text-muted-foreground mt-1">Você foi convidado para acessar o portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={cliente.nome} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={cliente.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input id="senha" type={showPassword ? 'text' : 'password'} required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar senha</Label>
                <Input id="confirmar" type="password" required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a senha" />
              </div>
              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
