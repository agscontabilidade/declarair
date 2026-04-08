import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ConviteData {
  id: string;
  email: string;
  nome: string;
  papel: string;
  escritorio_id: string;
  token: string;
  usado: boolean;
  expira_em: string;
  escritorio_nome?: string;
}

export default function ConviteColaborador() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [convite, setConvite] = useState<ConviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [aceitando, setAceitando] = useState(false);

  useEffect(() => {
    if (!token) {
      setErro('Token inválido');
      setLoading(false);
      return;
    }
    carregarConvite();
  }, [token]);

  const carregarConvite = async () => {
    try {
      // Sign out any existing session first
      await supabase.auth.signOut();

      const { data, error } = await supabase.rpc('get_colaborador_invite_public', {
        _token: token,
      });

      if (error || !data || (Array.isArray(data) && data.length === 0)) {
        setErro('Convite inválido ou já utilizado');
        return;
      }

      const invite = Array.isArray(data) ? data[0] : data;

      if (new Date(invite.expira_em) < new Date()) {
        setErro('Este convite expirou. Solicite um novo convite ao Responsável Técnico.');
        return;
      }

      setConvite({
        id: invite.id,
        email: invite.email,
        nome: invite.nome,
        papel: invite.papel,
        escritorio_id: invite.escritorio_id,
        token: token!,
        usado: false,
        expira_em: invite.expira_em,
        escritorio_nome: invite.escritorio_nome,
      });
    } catch (error) {
      console.error('Erro ao carregar convite:', error);
      setErro('Erro ao carregar convite');
    } finally {
      setLoading(false);
    }
  };

  const handleAceitarConvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (senha.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres');
      return;
    }

    if (!convite) return;
    setAceitando(true);

    try {
      // 1. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: convite.email,
        password: senha,
        options: {
          data: {
            nome: convite.nome,
            tipo_usuario: 'contador',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar conta');

      // 2. Use RPC to create usuario + mark invite as used (needs service role)
      // Since we can't insert into usuarios directly (RLS), we'll use supabase.functions
      const { error: fnError } = await supabase.functions.invoke('accept-collaborator-invite', {
        body: {
          convite_id: convite.id,
          user_id: authData.user.id,
          email: convite.email,
          nome: convite.nome,
          escritorio_id: convite.escritorio_id,
          papel: convite.papel,
        },
      });

      if (fnError) throw fnError;

      toast.success('Conta criada com sucesso! Verifique seu email para confirmar.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: any) {
      console.error('Erro ao aceitar convite:', error);
      if (error.message?.includes('already registered')) {
        toast.error('Este email já possui uma conta. Faça login.');
        navigate('/login');
      } else {
        toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setAceitando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>{erro}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/login')} variant="outline">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!convite) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
          <CardTitle>Convite para Profissional Contábil</CardTitle>
          <CardDescription>
            Você foi convidado para a equipe de{' '}
            <strong>{convite.escritorio_nome || 'um escritório'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAceitarConvite} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={convite.nome} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={convite.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Criar Senha</Label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Digite a senha novamente"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={aceitando}>
              {aceitando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Aceitar Convite e Criar Conta'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
