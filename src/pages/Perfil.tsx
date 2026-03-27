import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissoes } from '@/hooks/usePermissoes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatarPapel, PAPEL_COLORS } from '@/lib/formatters';
import {
  Shield, FileText, Users, Settings, DollarSign, Check, X,
  Key, Eye, Upload, Loader2, User, Lock, Bell, AlertTriangle,
} from 'lucide-react';

interface PermItem { label: string; icon: React.ElementType; allowed: boolean }

export default function Perfil() {
  const { user, profile } = useAuth();
  const perms = usePermissoes();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initials = profile.nome?.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?';
  const papel = profile.papel || 'colaborador';

  // Editable state
  const [isLoading, setIsLoading] = useState(false);
  const [nome, setNome] = useState(profile.nome || '');
  const [telefone, setTelefone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Notifications
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsApp, setNotifWhatsApp] = useState(true);

  // Fetch full user record
  const { data: usuario } = useQuery({
    queryKey: ['usuario-perfil', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || '');
      setTelefone(usuario.telefone || '');
      setAvatarUrl(usuario.avatar_url || null);
      const prefs = (usuario as any).preferencias_notificacao;
      if (prefs) {
        setNotifEmail(prefs.email ?? true);
        setNotifWhatsApp(prefs.whatsapp ?? true);
      }
    }
  }, [usuario]);

  // Fetch user's assigned declarations
  const { data: minhasDeclaracoes = [] } = useQuery({
    queryKey: ['minhas-declaracoes', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('declaracoes')
        .select('id, ano_base, status, clientes(nome, cpf)')
        .eq('contador_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch recent activity
  const { data: atividadeRecente = [] } = useQuery({
    queryKey: ['atividade-recente', profile.escritorioId],
    queryFn: async () => {
      const { data } = await supabase
        .from('declaracao_atividades')
        .select('id, tipo, descricao, created_at, declaracao_id')
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    enabled: !!profile.escritorioId,
  });

  const permissoesList: PermItem[] = [
    { label: 'Ver clientes', icon: Users, allowed: perms.podeVerClientes },
    { label: 'Criar clientes', icon: Users, allowed: perms.podeCriarClientes },
    { label: 'Editar clientes', icon: Users, allowed: perms.podeEditarClientes },
    { label: 'Excluir clientes', icon: Users, allowed: perms.podeExcluirCliente },
    { label: 'Ver declarações', icon: FileText, allowed: perms.podeVerDeclaracoes },
    { label: 'Criar declarações', icon: FileText, allowed: perms.podeCriarDeclaracoes },
    { label: 'Ver cobranças', icon: DollarSign, allowed: perms.podeVerCobrancas },
    { label: 'Excluir cobranças', icon: DollarSign, allowed: perms.podeExcluirCobranca },
    { label: 'Gerenciar usuários', icon: Users, allowed: perms.podeGerenciarUsuarios },
    { label: 'Alterar escritório', icon: Settings, allowed: perms.podeAlterarEscritorio },
    { label: 'Gerenciar templates', icon: FileText, allowed: perms.podeGerenciarTemplates },
  ];

  const statusLabels: Record<string, { label: string; color: string }> = {
    aguardando_documentos: { label: 'Aguardando Docs', color: 'bg-warning/10 text-warning border-warning/20' },
    documentacao_recebida: { label: 'Docs Recebidos', color: 'bg-accent/10 text-accent border-accent/20' },
    declaracao_pronta: { label: 'Pronta', color: 'bg-primary/10 text-primary border-primary/20' },
    transmitida: { label: 'Transmitida', color: 'bg-success/10 text-success border-success/20' },
  };

  // Avatar upload
  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP');
      return;
    }

    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ['usuario-perfil'] });
      toast.success('Foto atualizada!');
    } catch (error: any) {
      console.error('[Perfil] Upload error:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setIsLoading(false);
    }
  }

  // Save personal data
  async function handleSaveProfile() {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ nome, telefone })
        .eq('id', user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['usuario-perfil'] });
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  }

  // Change password
  async function handleChangePassword() {
    if (!novaSenha || !confirmarSenha) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch {
      toast.error('Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  }

  // Save notification preferences
  async function handleSavePreferences() {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          preferencias_notificacao: { email: notifEmail, whatsapp: notifWhatsApp },
        } as any)
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Preferências salvas!');
    } catch {
      toast.error('Erro ao salvar preferências');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <h1 className="font-display text-2xl font-bold text-foreground">Meu Perfil</h1>

        <Tabs defaultValue="dados">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados" className="gap-2">
              <User className="h-4 w-4" /> Dados
            </TabsTrigger>
            <TabsTrigger value="senha" className="gap-2">
              <Lock className="h-4 w-4" /> Senha
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="h-4 w-4" /> Notificações
            </TabsTrigger>
            <TabsTrigger value="avancado" className="gap-2">
              <AlertTriangle className="h-4 w-4" /> Avançado
            </TabsTrigger>
          </TabsList>

          {/* ─── Dados Pessoais ─── */}
          <TabsContent value="dados" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
              {/* Avatar + Edit */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Foto de Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24 text-2xl">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-accent text-accent-foreground font-display font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                        disabled={isLoading}
                      />
                      <Label htmlFor="avatar-upload">
                        <Button variant="outline" asChild disabled={isLoading}>
                          <span>
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Alterar Foto
                          </span>
                        </Button>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-2">
                        JPG, PNG ou WebP. Máximo 2MB.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado</p>
                    </div>
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        placeholder="(00) 00000-0000"
                        disabled={isLoading}
                      />
                    </div>
                    <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full">
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Permissions Card */}
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-accent" /> Permissões
                  </CardTitle>
                  <CardDescription>
                    Nível de acesso: <Badge className={papelColors[papel]}>{papelLabels[papel] || papel}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {permissoesList.map((p, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-muted/30">
                        <p.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1">{p.label}</span>
                        {p.allowed ? (
                          <Check className="h-4 w-4 text-[hsl(var(--success))]" />
                        ) : (
                          <X className="h-4 w-4 text-destructive/50" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My declarations */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" /> Minhas Declarações
                </CardTitle>
                <CardDescription>Declarações atribuídas a você como responsável</CardDescription>
              </CardHeader>
              <CardContent>
                {minhasDeclaracoes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma declaração atribuída</p>
                ) : (
                  <div className="space-y-2">
                    {minhasDeclaracoes.map((d: any) => {
                      const st = statusLabels[d.status] || { label: d.status, color: 'bg-muted text-muted-foreground' };
                      return (
                        <div
                          key={d.id}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/declaracoes/${d.id}`)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{d.clientes?.nome ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">Ano base {d.ano_base}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-accent" /> Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {atividadeRecente.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade registrada</p>
                ) : (
                  <div className="space-y-2">
                    {atividadeRecente.map((a: any) => (
                      <div key={a.id} className="flex items-start gap-3 py-2 px-3 rounded-lg bg-muted/20">
                        <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{a.descricao}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(a.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Senha ─── */}
          <TabsContent value="senha" className="mt-6">
            <Card className="shadow-sm max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg">Alterar Senha</CardTitle>
                <CardDescription>Defina uma nova senha para sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nova-senha">Nova Senha</Label>
                  <Input
                    id="nova-senha"
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmar-senha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Alterar Senha
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Notificações ─── */}
          <TabsContent value="notificacoes" className="mt-6">
            <Card className="shadow-sm max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg">Preferências de Notificação</CardTitle>
                <CardDescription>Escolha como deseja receber alertas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Notificações por Email</p>
                    <p className="text-xs text-muted-foreground">Receba atualizações por email</p>
                  </div>
                  <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Notificações por WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Receba alertas importantes no WhatsApp</p>
                  </div>
                  <Switch checked={notifWhatsApp} onCheckedChange={setNotifWhatsApp} />
                </div>
                <Button onClick={handleSavePreferences} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Preferências
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Avançado ─── */}
          <TabsContent value="avancado" className="mt-6">
            <Card className="shadow-sm max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg">Zona de Perigo</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Excluir Conta</p>
                    <p className="text-sm mb-4">
                      Ao excluir sua conta, todos os seus dados serão permanentemente removidos.
                      Esta ação não pode ser desfeita.
                    </p>
                    <Button variant="destructive" size="sm">
                      Solicitar Exclusão de Conta
                    </Button>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
