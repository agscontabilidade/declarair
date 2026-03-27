import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';
import logoIcon from '@/assets/logo-icon.png';

export default function Login() {
  const navigate = useNavigate();
  const { session, userType, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect when already authenticated
  useEffect(() => {
    if (!loading && session && userType) {
      if (userType === 'contador') {
        navigate('/dashboard', { replace: true });
      } else if (userType === 'cliente') {
        navigate('/cliente/dashboard', { replace: true });
      }
    }
  }, [loading, session, userType, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginSenha,
      });
      if (error) throw error;
      // Navigation will happen via the useEffect above once AuthContext updates
    } catch (err: any) {
      toast({ title: 'Erro ao entrar', description: err.message, variant: 'destructive' });
      setIsSubmitting(false);
    }
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
            Gerencie declarações<br />IRPF com eficiência
          </h2>
          <p className="text-primary-foreground/70 text-lg leading-relaxed max-w-sm">
            Acesse seu painel e acompanhe todas as declarações do seu escritório em um só lugar.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary-foreground/60 text-sm">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>Dashboard completo com Kanban</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/60 text-sm">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span>Portal do cliente integrado</span>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-primary-foreground/40 text-xs">© {new Date().getFullYear()} DeclaraIR</p>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <img src={logoIcon} alt="DeclaraIR" className="h-10 w-10" />
            <img src={logoFull} alt="DeclaraIR" className="h-7" />
          </div>

          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Área do Contador</h1>
              <p className="text-muted-foreground mt-1">Gerencie declarações IRPF do seu escritório</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-senha">Senha</Label>
                <div className="relative">
                  <Input id="login-senha" type={showPassword ? 'text' : 'password'} required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={isSubmitting || loading}>
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
              <Link to="/recuperar-senha" className="block text-center">
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors">Esqueceu sua senha?</span>
              </Link>
              <div className="text-center pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Não tem uma conta?{' '}
                  <Link to="/cadastro" className="text-accent hover:underline font-medium">Criar conta</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
