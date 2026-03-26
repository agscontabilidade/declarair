import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissoes } from '@/hooks/usePermissoes';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield, FileText, Users, Settings, DollarSign, Check, X, Key, Eye, Pencil } from 'lucide-react';

const papelLabels: Record<string, string> = {
  dono: 'Dono',
  administrador: 'Administrador',
  colaborador: 'Colaborador',
  operador: 'Operador',
};

const papelColors: Record<string, string> = {
  dono: 'bg-accent text-accent-foreground',
  administrador: 'bg-primary text-primary-foreground',
  colaborador: 'bg-secondary text-secondary-foreground',
  operador: 'bg-muted text-muted-foreground',
};

interface PermItem { label: string; icon: React.ElementType; allowed: boolean }

export default function Perfil() {
  const { user, profile } = useAuth();
  const perms = usePermissoes();
  const navigate = useNavigate();

  const initials = profile.nome?.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?';
  const papel = profile.papel || 'colaborador';

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

  async function handleAlterarSenha() {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) {
      toast.error('Erro ao enviar email de recuperação');
    } else {
      toast.success('Email de recuperação enviado!');
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <h1 className="font-display text-2xl font-bold text-foreground">Meu Perfil</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
          {/* Profile Card */}
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 text-lg">
                  <AvatarFallback className="bg-accent text-accent-foreground font-display font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-xl font-bold text-foreground truncate">{profile.nome ?? '—'}</h2>
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  <Badge className={`mt-2 ${papelColors[papel]}`}>
                    {papelLabels[papel] || papel}
                  </Badge>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Nome completo</Label>
                  <p className="text-sm font-medium">{profile.nome ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="text-sm font-medium">{user?.email ?? '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Papel</Label>
                  <p className="text-sm font-medium">{papelLabels[papel] || papel}</p>
                </div>
              </div>

              <Separator className="my-5" />

              <Button variant="outline" className="w-full gap-2" onClick={handleAlterarSenha}>
                <Key className="h-4 w-4" /> Alterar Senha
              </Button>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" /> Permissões
              </CardTitle>
              <CardDescription>Nível de acesso: <span className="font-semibold text-foreground">{papelLabels[papel]}</span></CardDescription>
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
      </div>
    </DashboardLayout>
  );
}
