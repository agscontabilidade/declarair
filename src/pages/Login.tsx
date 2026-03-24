import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');

  // Signup state
  const [nome, setNome] = useState('');
  const [nomeEscritorio, setNomeEscritorio] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupSenha, setSignupSenha] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginSenha,
      });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Erro ao entrar', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupSenha,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar conta');

      const { error: rpcError } = await supabase.rpc('handle_new_accountant_signup' as any, {
        p_user_id: authData.user.id,
        p_nome: nome,
        p_nome_escritorio: nomeEscritorio,
        p_email: signupEmail,
      });
      if (rpcError) throw rpcError;

      toast({
        title: 'Conta criada!',
        description: 'Verifique seu email para confirmar a conta.',
      });
    } catch (err: any) {
      toast({ title: 'Erro ao criar conta', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-accent" />
            <span className="font-display text-2xl font-bold text-primary">DeclaraIR</span>
          </div>
          <CardTitle className="font-display text-xl">Área do Contador</CardTitle>
          <CardDescription>Gerencie declarações IRPF do seu escritório</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-senha">Senha</Label>
                  <Input id="login-senha" type="password" required value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
                <Link to="/recuperar-senha" className="block text-center">
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors">Esqueceu sua senha?</span>
                </Link>
              </form>
            </TabsContent>

            <TabsContent value="criar">
              <form onSubmit={handleSignup} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Seu nome</Label>
                  <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="João Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="escritorio">Nome do escritório</Label>
                  <Input id="escritorio" required value={nomeEscritorio} onChange={(e) => setNomeEscritorio(e.target.value)} placeholder="Contabilidade Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-senha">Senha</Label>
                  <Input id="signup-senha" type="password" required minLength={6} value={signupSenha} onChange={(e) => setSignupSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <p className="absolute bottom-4 text-xs text-muted-foreground">© 2025–2026 DeclaraIR</p>
    </div>
  );
}
