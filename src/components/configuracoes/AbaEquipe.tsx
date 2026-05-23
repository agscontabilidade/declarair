import { useState } from 'react';
import { useColaboradores } from '@/hooks/useColaboradores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Copy, Trash2, ShieldCheck, Loader2, Pencil, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { formatarPapel } from '@/lib/formatters';
import { SeletorPermissoes } from './SeletorPermissoes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Usuario = Tables<'usuarios'>;

interface AbaEquipeProps {
  escritorioId: string | null;
  isDono: boolean;
  usuarios: Usuario[] | undefined;
  loadingUsers: boolean;
}

export default function AbaEquipe({ escritorioId, isDono, usuarios, loadingUsers }: AbaEquipeProps) {
  const { convitesPendentes, enviarConvite, cancelarConvite, removerColaborador, atualizarPermissoes } =
    useColaboradores(escritorioId || '');

  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<string[]>([]);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [editPermissoesOpen, setEditPermissoesOpen] = useState(false);
  const [permissoesEditando, setPermissoesEditando] = useState<string[]>([]);

  // Edição de dados (nome/email) do membro
  const [editDadosOpen, setEditDadosOpen] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const abrirEditDados = (u: Usuario) => {
    setUsuarioEditando(u);
    setEditNome(u.nome || '');
    setEditEmail(u.email || '');
    setEditDadosOpen(true);
  };

  const salvarEditDados = async () => {
    if (!usuarioEditando) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from('usuarios')
      .update({ nome: editNome, email: editEmail })
      .eq('id', usuarioEditando.id);
    setSavingEdit(false);
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
      return;
    }
    toast.success('Membro atualizado com sucesso');
    setEditDadosOpen(false);
    setUsuarioEditando(null);
    queryClient.invalidateQueries({ queryKey: ['contadores', escritorioId] });
  };

  const reativarMembro = async (u: Usuario) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: true })
      .eq('id', u.id);
    if (error) {
      toast.error('Erro ao reativar: ' + error.message);
      return;
    }
    toast.success('Membro reativado');
    queryClient.invalidateQueries({ queryKey: ['contadores', escritorioId] });
  };

  const handleEnviarConvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await enviarConvite.mutateAsync({ 
      email: novoEmail, 
      nome: novoNome,
      permissoes: permissoesSelecionadas 
    });
    setDialogOpen(false);
    setNovoEmail('');
    setNovoNome('');
    setPermissoesSelecionadas([]);
  };

  const handleAbrirEditPermissoes = async (u: Usuario) => {
    setUsuarioEditando(u);
    setEditPermissoesOpen(true);
    
    // Buscar permissões atuais do usuário
    const { data } = await supabase
      .from('usuario_permissoes')
      .select('permissao_id')
      .eq('user_id', u.id);
    
    if (data) {
      setPermissoesEditando(data.map(p => p.permissao_id));
    }
  };

  const handleSalvarPermissoes = async () => {
    if (!usuarioEditando) return;
    await atualizarPermissoes.mutateAsync({
      usuarioId: usuarioEditando.id,
      permissoesIds: permissoesEditando
    });
    setEditPermissoesOpen(false);
    setUsuarioEditando(null);
  };

  const copiarLink = (token: string) => {
    const link = `${window.location.origin}/convite-colaborador/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Equipe</CardTitle>
              <CardDescription>Gerencie os profissionais contábeis do escritório</CardDescription>
            </div>
            {isDono && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convidar Profissional
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Convidar Novo Profissional Contábil</DialogTitle>
                    <DialogDescription>
                      Envie um convite para adicionar um novo membro à equipe com permissões específicas
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleEnviarConvite} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome completo" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="email@exemplo.com" required />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Permissões do Usuário</Label>
                      <SeletorPermissoes 
                        permissoesSelecionadas={permissoesSelecionadas} 
                        onChange={setPermissoesSelecionadas} 
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={enviarConvite.isPending}>
                      {enviarConvite.isPending ? 'Enviando...' : 'Enviar Convite'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : !usuarios?.length ? (
            <p className="text-muted-foreground text-sm">Nenhum usuário encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Status</TableHead>
                  {isDono && <TableHead>Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatarPapel(u.papel)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    {isDono && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirEditDados(u)}
                            title="Editar dados"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          {u.papel !== 'dono' && u.ativo && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAbrirEditPermissoes(u)}
                                title="Gerenciar Permissões"
                              >
                                <ShieldCheck className="h-4 w-4 text-primary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja desativar este profissional?')) {
                                    removerColaborador.mutate(u.id);
                                  }
                                }}
                                title="Desativar"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {u.papel !== 'dono' && !u.ativo && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reativarMembro(u)}
                              title="Reativar"
                            >
                              <RotateCcw className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {convitesPendentes.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Convites Pendentes</CardTitle>
            <CardDescription>Convites enviados aguardando aceitação</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convitesPendentes.map((convite) => (
                  <TableRow key={convite.id}>
                    <TableCell>{convite.nome}</TableCell>
                    <TableCell>{convite.email}</TableCell>
                    <TableCell>{new Date(convite.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{new Date(convite.expira_em).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => copiarLink(convite.token)} title="Copiar link">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Cancelar este convite?')) {
                              cancelarConvite.mutate(convite.id);
                            }
                          }}
                          title="Cancelar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={editPermissoesOpen} onOpenChange={setEditPermissoesOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Permissões</DialogTitle>
            <DialogDescription>
              Ajuste as permissões de acesso para <strong>{usuarioEditando?.nome}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <SeletorPermissoes 
              permissoesSelecionadas={permissoesEditando} 
              onChange={setPermissoesEditando} 
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setEditPermissoesOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSalvarPermissoes} 
              disabled={atualizarPermissoes.isPending}
            >
              {atualizarPermissoes.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDadosOpen} onOpenChange={setEditDadosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
            <DialogDescription>Atualize o nome e o e-mail de <strong>{usuarioEditando?.nome}</strong>.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setEditDadosOpen(false)}>Cancelar</Button>
            <Button onClick={salvarEditDados} disabled={savingEdit}>
              {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
