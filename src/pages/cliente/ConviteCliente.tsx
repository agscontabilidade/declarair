import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
    if (!cliente) return;

    setSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cliente.email!,
        password: senha,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar conta');

      // Link auth user to cliente and clear token
      const { error: clearError } = await supabase.rpc('limpar_token_convite', {
        _cliente_id: cliente.id,
        _auth_user_id: authData.user.id,
      });
      if (clearError) throw clearError;

      toast({ title: 'Conta criada!', description: 'Verifique seu email para confirmar.' });
      navigate('/cliente/login');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Convite Inválido</CardTitle>
            <CardDescription>Este link de convite expirou ou já foi utilizado.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-accent" />
            <span className="font-display text-2xl font-bold text-primary">DeclaraIR</span>
          </div>
          <CardTitle className="font-display text-xl">Crie sua conta</CardTitle>
          <CardDescription>Você foi convidado para acessar o portal</CardDescription>
        </CardHeader>
        <CardContent>
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
              <Input id="senha" type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar senha</Label>
              <Input id="confirmar" type="password" required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a senha" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
