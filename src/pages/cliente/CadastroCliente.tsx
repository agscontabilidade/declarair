import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, CheckCircle2, Loader2, XCircle } from 'lucide-react';
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
  const [erros, setErros] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    aceitouTermos: false,
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
            cpf: data.convite.cpf_sugerido ? formatarCPF(data.convite.cpf_sugerido) : '',
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

  const formatarTelefone = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);
    return numeros
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const validarCampos = (): boolean => {
    const novosErros: Record<string, string> = {};

    if (!form.nome.trim()) novosErros.nome = 'Nome é obrigatório';
    if (!form.cpf.trim()) novosErros.cpf = 'CPF é obrigatório';
    else if (form.cpf.replace(/\D/g, '').length !== 11) novosErros.cpf = 'CPF inválido';
    if (!form.email.trim()) novosErros.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(form.email)) novosErros.email = 'Email inválido';
    if (!form.telefone.trim()) novosErros.telefone = 'Telefone é obrigatório';
    if (!form.senha) novosErros.senha = 'Senha é obrigatória';
    else if (form.senha.length < 6) novosErros.senha = 'Mínimo 6 caracteres';
    if (form.senha !== form.confirmarSenha) novosErros.confirmarSenha = 'Senhas não conferem';
    if (!form.aceitouTermos) novosErros.termos = 'Você deve aceitar os termos';

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarCampos()) {
      toast({ title: 'Corrija os erros no formulário', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-from-invite', {
        body: {
          token,
          nome: form.nome.trim(),
          cpf: form.cpf,
          email: form.email.trim(),
          telefone: form.telefone || null,
          senha: form.senha,
        },
      });

      if (error) throw new Error(error.message || 'Erro ao cadastrar');
      if (data?.error) throw new Error(data.error);

      // Auto-login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.senha,
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
  };

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

  if (invalido || !convite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Link Inválido</h2>
            <p className="text-muted-foreground mb-6">
              Este link de convite é inválido, expirou ou já foi utilizado.
            </p>
            <Button variant="outline" onClick={() => navigate('/cliente/login')}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
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
            Bem-vindo!<br />Crie sua conta
          </h2>
          {convite.mensagem_personalizada ? (
            <p className="text-white/70 text-lg leading-relaxed max-w-sm">
              {convite.mensagem_personalizada}
            </p>
          ) : (
            <p className="text-white/70 text-lg leading-relaxed max-w-sm">
              Complete seu cadastro para iniciar sua declaração de Imposto de Renda.
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto">
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

          {convite.mensagem_personalizada && (
            <Alert className="mb-6">
              <AlertDescription>{convite.mensagem_personalizada}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Criar sua conta</CardTitle>
              <CardDescription>Preencha os dados abaixo para começar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="João da Silva"
                    className={erros.nome ? 'border-destructive' : ''}
                  />
                  {erros.nome && <p className="text-xs text-destructive">{erros.nome}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={erros.cpf ? 'border-destructive' : ''}
                  />
                  {erros.cpf && <p className="text-xs text-destructive">{erros.cpf}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seu@email.com"
                    className={erros.email ? 'border-destructive' : ''}
                  />
                  {erros.email && <p className="text-xs text-destructive">{erros.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className={erros.telefone ? 'border-destructive' : ''}
                  />
                  {erros.telefone && <p className="text-xs text-destructive">{erros.telefone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={form.senha}
                      onChange={(e) => setForm({ ...form, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className={erros.senha ? 'border-destructive' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {erros.senha && <p className="text-xs text-destructive">{erros.senha}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmar">Confirmar Senha *</Label>
                  <Input
                    id="confirmar"
                    type="password"
                    value={form.confirmarSenha}
                    onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
                    placeholder="Repita a senha"
                    className={erros.confirmarSenha ? 'border-destructive' : ''}
                  />
                  {erros.confirmarSenha && <p className="text-xs text-destructive">{erros.confirmarSenha}</p>}
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <Checkbox
                    id="termos"
                    checked={form.aceitouTermos}
                    onCheckedChange={(checked) => setForm({ ...form, aceitouTermos: !!checked })}
                  />
                  <label htmlFor="termos" className="text-sm leading-tight cursor-pointer">
                    Li e aceito os{' '}
                    <a href="/termos-de-uso" target="_blank" className="text-primary hover:underline">
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href="/politica-de-privacidade" target="_blank" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>
                  </label>
                </div>
                {erros.termos && <p className="text-xs text-destructive">{erros.termos}</p>}

                <Button type="submit" className="w-full h-11" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Minha Conta'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem uma conta?{' '}
            <a href="/cliente/login" className="text-primary hover:underline font-medium">
              Fazer login
            </a>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            🔒 Seus dados estão protegidos e serão usados apenas para sua declaração
          </p>
        </div>
      </div>
    </div>
  );
}
