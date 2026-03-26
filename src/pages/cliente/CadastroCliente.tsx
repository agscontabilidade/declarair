import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ConviteData {
  id: string;
  escritorio_id: string;
  nome_sugerido: string | null;
  cpf_sugerido: string | null;
  email_sugerido: string | null;
  mensagem_personalizada: string | null;
}

interface EscritorioData {
  id: string;
  nome: string;
  logo_url: string | null;
  cor_primaria: string | null;
  nome_portal: string | null;
}

export default function CadastroCliente() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [convite, setConvite] = useState<ConviteData | null>(null);
  const [escritorio, setEscritorio] = useState<EscritorioData | null>(null);
  const [invalido, setInvalido] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
  });

  useEffect(() => {
    async function validarToken() {
      if (!token) { setInvalido(true); setLoading(false); return; }

      try {
        const { data, error } = await supabase.functions.invoke('validate-invite-token', {
          body: { token },
        });

        if (error || !data?.valido) {
          setInvalido(true);
        } else {
          setConvite(data.convite);
          setEscritorio(data.escritorio);
          setForm((f) => ({
            ...f,
            nome: data.convite.nome_sugerido || '',
            cpf: data.convite.cpf_sugerido || '',
            email: data.convite.email_sugerido || '',
          }));
        }
      } catch {
        setInvalido(true);
      } finally {
        setLoading(false);
      }
    }
    validarToken();
  }, [token]);

  const formatarCPF = (value: string) => {
    const nums = value.replace(/\D/g, '').slice(0, 11);
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.senha !== form.confirmarSenha) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }
    if (form.senha.length < 6) {
      toast({ title: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-from-invite', {
        body: {
          token,
          nome: form.nome,
          cpf: form.cpf,
          email: form.email,
          telefone: form.telefone || null,
          senha: form.senha,
        },
      });

      if (error) throw new Error(error.message || 'Erro ao cadastrar');
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Conta criada com sucesso!', description: 'Faça login para acessar o portal.' });
      navigate('/cliente/login');
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (invalido || !convite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-destructive">Link Inválido</h1>
          <p className="text-muted-foreground">Este link de convite expirou ou já foi utilizado.</p>
          <Button variant="outline" onClick={() => navigate('/cliente/login')}>
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  const primaryColor = escritorio?.cor_primaria || 'hsl(var(--primary))';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - branding */}
      <div
        className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-10 overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="absolute top-20 -right-20 w-72 h-72 rounded-full border border-white/10" />
        <div className="absolute bottom-32 -left-16 w-56 h-56 rounded-3xl border border-white/10 rotate-12" />

        <div className="relative z-10">
          {escritorio?.logo_url ? (
            <img src={escritorio.logo_url} alt={escritorio.nome} className="h-12 mb-4" />
          ) : (
            <h2 className="text-xl font-bold text-white">
              {escritorio?.nome_portal || escritorio?.nome}
            </h2>
          )}
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-3xl font-bold text-white leading-tight">
            Crie sua conta<br />e declare seu IR
          </h2>
          {convite.mensagem_personalizada && (
            <p className="text-white/70 text-lg leading-relaxed max-w-sm">
              {convite.mensagem_personalizada}
            </p>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-white/60 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Envio seguro de documentos</span>
            </div>
            <div className="flex items-center gap-3 text-white/60 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Acompanhamento em tempo real</span>
            </div>
            <div className="flex items-center gap-3 text-white/60 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Chat direto com seu contador</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          © {new Date().getFullYear()} {escritorio?.nome}
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            {escritorio?.logo_url ? (
              <img src={escritorio.logo_url} alt={escritorio.nome} className="h-10 mx-auto" />
            ) : (
              <h2 className="text-lg font-bold text-foreground">
                {escritorio?.nome_portal || escritorio?.nome}
              </h2>
            )}
          </div>

          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
            <div className="text-center mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground">Crie sua conta</h1>
              <p className="text-muted-foreground mt-1">
                Preencha seus dados para acessar o portal
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input
                  id="nome"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  required
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha *</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.senha}
                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar senha *</Label>
                <Input
                  id="confirmar"
                  type="password"
                  required
                  value={form.confirmarSenha}
                  onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                  placeholder="Repita a senha"
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={submitting}>
                {submitting ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <a href="/cliente/login" className="text-primary hover:underline font-medium">
                Fazer login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
