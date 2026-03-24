import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');


  async function handleLogin(e: React.FormEvent) {

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
          <form onSubmit={handleLogin} className="space-y-4 mt-2">
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
            <div className="text-center pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link to="/cadastro" className="text-accent hover:underline font-medium">Criar conta</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="absolute bottom-4 text-xs text-muted-foreground">© 2025–2026 DeclaraIR</p>
    </div>
  );
}
