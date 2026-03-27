import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import logoFull from '@/assets/logo-full.png';
import logoIcon from '@/assets/logo-icon.png';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${PORTAL_BASE_URL}/redefinir-senha`,
      });
      if (error) throw error;
      setEnviado(true);
      toast({ title: 'Email enviado', description: 'Verifique sua caixa de entrada.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
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
            Vamos te ajudar a<br />recuperar o acesso
          </h2>
          <p className="text-primary-foreground/70 text-lg leading-relaxed max-w-sm">
            Enviaremos um link seguro para você redefinir sua senha.
          </p>
          <div className="flex items-center gap-3 text-primary-foreground/60 text-sm">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <span>Processo rápido e seguro</span>
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
              <h1 className="font-display text-2xl font-bold text-foreground">Recuperar Senha</h1>
              <p className="text-muted-foreground mt-1">
                {enviado
                  ? 'Verifique seu email para continuar'
                  : 'Informe seu email para receber o link de recuperação'}
              </p>
            </div>

            {enviado ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Se este email estiver cadastrado, você receberá um link para redefinir sua senha.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full mt-2 h-11">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
                <Link to="/login" className="block text-center">
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="h-3 w-3 inline mr-1" />
                    Voltar ao login
                  </span>
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
