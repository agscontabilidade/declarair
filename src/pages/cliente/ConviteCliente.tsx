import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Clock, Eye, EyeOff, Loader2, LogIn, MessageCircle, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import logoFull from '@/assets/logo-full.png';
import { getErrorMessage } from '@/lib/errors';

interface ValidacaoResultado {
  status: 'valido' | 'expirado' | 'concluido' | 'inexistente';
  cliente_id: string | null;
  nome: string | null;
  email: string | null;
  escritorio_id: string | null;
  escritorio_nome: string | null;
}

const SUPORTE_WHATSAPP = 'https://wa.me/5511998755782?text=' + encodeURIComponent('Olá! Tive um problema ao acessar o link de convite do portal do contribuinte.');

export default function ConviteCliente() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [resultado, setResultado] = useState<ValidacaoResultado | null>(null);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function fetchCliente() {
      if (!token) {
        setResultado({ status: 'inexistente', cliente_id: null, nome: null, email: null, escritorio_id: null, escritorio_nome: null });
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.rpc('validar_token_convite_cliente', { _token: token });
      if (error || !data || data.length === 0) {
        setResultado({ status: 'inexistente', cliente_id: null, nome: null, email: null, escritorio_id: null, escritorio_nome: null });
        setLoading(false);
        return;
      }
      setResultado(data[0] as ValidacaoResultado);
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
    if (!resultado || resultado.status !== 'valido' || !resultado.email) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-from-direct-invite', {
        body: { token, senha },
      });

      // Edge function returned non-2xx: try to surface the server's specific message first
      if (data?.error) throw new Error(data.error);
      if (error) {
        // FunctionsHttpError exposes the original Response via `context`
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json();
            if (body?.error) throw new Error(body.error);
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message) throw parseErr;
          }
        }
        throw new Error(error.message || 'Erro ao criar conta');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: resultado.email,
        password: senha,
      });

      if (signInError) {
        toast({ title: 'Conta criada!', description: 'Faça login para acessar o portal.' });
        navigate('/cliente/login');
        return;
      }

      toast({ title: 'Conta criada com sucesso!', description: 'Redirecionando para o portal...' });
      setTimeout(() => navigate('/cliente/dashboard'), 1500);
    } catch (err: unknown) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  const BrandingSide = (
    <div className="hidden lg:flex lg:w-[42%] bg-primary relative flex-col justify-between p-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/30" />
      <div className="absolute top-20 -right-20 w-72 h-72 rounded-full border border-primary-foreground/10" />
      <div className="absolute bottom-32 -left-16 w-56 h-56 rounded-3xl border border-primary-foreground/10 rotate-12" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <img src={logoFull} alt="DeclaraIR" className="h-10 brightness-0 invert" />
        </div>
      </div>
      <div className="relative z-10 space-y-6">
        <h2 className="font-display text-3xl font-bold text-primary-foreground leading-tight">
          Portal do<br />contribuinte
        </h2>
        <p className="text-primary-foreground/70 text-lg leading-relaxed max-w-sm">
          Acompanhe sua declaração, envie documentos e converse com seu contador em um só lugar.
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
  );

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

  // Estados de erro/aviso
  if (!resultado || resultado.status !== 'valido') {
    const status = resultado?.status ?? 'inexistente';

    const config = (() => {
      switch (status) {
        case 'concluido':
          return {
            icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />,
            iconBg: 'bg-emerald-500/10',
            titulo: 'Você já tem conta criada',
            titleClass: 'text-foreground',
            descricao: resultado?.nome
              ? `${resultado.nome.split(' ')[0]}, sua conta já está ativa. Acesse o portal usando seu email e senha.`
              : 'Sua conta já está ativa. Acesse o portal usando seu email e senha.',
            primaryAction: (
              <Button onClick={() => navigate('/cliente/login')} className="w-full gap-2">
                <LogIn className="h-4 w-4" />
                Ir para o login
              </Button>
            ),
          };
        case 'expirado':
          return {
            icon: <Clock className="h-8 w-8 text-warning" />,
            iconBg: 'bg-warning/10',
            titulo: 'Este convite expirou',
            titleClass: 'text-foreground',
            descricao: resultado?.escritorio_nome
              ? `O link de convite enviado por ${resultado.escritorio_nome} venceu. Peça um novo link ao seu contador para criar sua conta.`
              : 'O link de convite venceu. Peça um novo link ao seu contador para criar sua conta.',
            primaryAction: (
              <Button asChild variant="outline" className="w-full gap-2">
                <a href={SUPORTE_WHATSAPP} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Falar com suporte
                </a>
              </Button>
            ),
          };
        default:
          return {
            icon: <AlertCircle className="h-8 w-8 text-destructive" />,
            iconBg: 'bg-destructive/10',
            titulo: 'Link inválido',
            titleClass: 'text-foreground',
            descricao: 'O link que você abriu não foi encontrado. Verifique se copiou o endereço completo, ou peça ao seu contador para gerar um novo convite.',
            primaryAction: (
              <Button asChild variant="outline" className="w-full gap-2">
                <a href={SUPORTE_WHATSAPP} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Falar com suporte
                </a>
              </Button>
            ),
          };
      }
    })();

    return (
      <div className="min-h-screen flex bg-background">
        {BrandingSide}
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden flex items-center justify-center gap-2.5 mb-2">
              <img src={logoFull} alt="DeclaraIR" className="h-9" />
            </div>

            <div className={`mx-auto h-16 w-16 rounded-2xl ${config.iconBg} flex items-center justify-center`}>
              {config.icon}
            </div>

            <div className="text-center space-y-2">
              <h1 className={`font-display text-2xl font-bold ${config.titleClass}`}>{config.titulo}</h1>
              <p className="text-muted-foreground leading-relaxed">{config.descricao}</p>
            </div>

            <div className="space-y-3">
              {config.primaryAction}
              {status !== 'concluido' && (
                <Button variant="ghost" onClick={() => navigate('/cliente/login')} className="w-full gap-2 text-muted-foreground">
                  Já tenho conta — fazer login
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Em caso de dúvida, fale com seu contador
                {resultado?.escritorio_nome ? ` (${resultado.escritorio_nome})` : ''}.
              </p>
              <Link to="/" className="text-xs text-primary hover:underline mt-2 inline-block">
                Voltar ao site
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado válido — formulário de criação de senha
  return (
    <div className="min-h-screen flex bg-background">
      {BrandingSide}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <img src={logoFull} alt="DeclaraIR" className="h-9" />
          </div>

          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Crie sua conta</h1>
              <p className="text-muted-foreground mt-1">
                {resultado.escritorio_nome
                  ? `${resultado.escritorio_nome} te convidou para o portal`
                  : 'Você foi convidado para acessar o portal'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={resultado.nome ?? ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={resultado.email ?? ''} disabled className="bg-muted" />
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
              <Button type="submit" className="w-full h-11" disabled={submitting || !resultado.email}>
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
