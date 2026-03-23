import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Users, CreditCard, Puzzle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissoes } from '@/hooks/usePermissoes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Configuracoes() {
  const { profile } = useAuth();
  const { isDono } = usePermissoes();
  const escritorioId = profile.escritorioId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: escritorio, isLoading: loadingEsc } = useQuery({
    queryKey: ['escritorio', escritorioId],
    queryFn: async () => {
      const { data, error } = await supabase.from('escritorios').select('*').eq('id', escritorioId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!escritorioId,
  });

  const { data: usuarios, isLoading: loadingUsers } = useQuery({
    queryKey: ['contadores', escritorioId],
    queryFn: async () => {
      const { data } = await supabase.from('usuarios').select('*').eq('escritorio_id', escritorioId!);
      return data || [];
    },
    enabled: !!escritorioId,
  });

  const currentYear = new Date().getFullYear();
  const { data: declCount } = useQuery({
    queryKey: ['decl-count', escritorioId, currentYear],
    queryFn: async () => {
      const { count } = await supabase.from('declaracoes').select('id', { count: 'exact', head: true }).eq('escritorio_id', escritorioId!).eq('ano_base', currentYear);
      return count ?? 0;
    },
    enabled: !!escritorioId,
  });

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (escritorio) {
      setNome(escritorio.nome || '');
      setEmail(escritorio.email || '');
      setTelefone(escritorio.telefone || '');
      setCnpj(escritorio.cnpj || '');
    }
  }, [escritorio]);

  async function handleSave() {
    if (!escritorioId || !isDono) return;
    setSaving(true);
    const { error } = await supabase.from('escritorios').update({ nome, email, telefone, cnpj }).eq('id', escritorioId);
    if (error) toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Dados salvos com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['escritorio', escritorioId] });
    }
    setSaving(false);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
        <Tabs defaultValue="escritorio">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="escritorio" className="gap-2"><Settings className="h-4 w-4" /> Escritório</TabsTrigger>
            <TabsTrigger value="usuarios" className="gap-2"><Users className="h-4 w-4" /> Usuários</TabsTrigger>
            <TabsTrigger value="plano" className="gap-2"><CreditCard className="h-4 w-4" /> Plano</TabsTrigger>
            <TabsTrigger value="integracoes" className="gap-2"><Puzzle className="h-4 w-4" /> Integrações</TabsTrigger>
          </TabsList>

          <TabsContent value="escritorio">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-lg">Dados do Escritório</CardTitle></CardHeader>
              <CardContent>
                {loadingEsc ? (
                  <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : (
                  <div className="space-y-4 max-w-lg">
                    <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} readOnly={!isDono} /></div>
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} readOnly={!isDono} /></div>
                    <div className="space-y-2"><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} readOnly={!isDono} /></div>
                    <div className="space-y-2"><Label>CNPJ</Label><Input value={cnpj} onChange={e => setCnpj(e.target.value)} readOnly={!isDono} /></div>
                    {!isDono && <p className="text-sm text-muted-foreground">Apenas o dono pode alterar os dados do escritório.</p>}
                    <Button onClick={handleSave} disabled={saving || !isDono}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Equipe</CardTitle>
                  {isDono && <Button size="sm" disabled>Convidar Colaborador</Button>}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuarios.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.nome}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell><Badge variant="outline">{u.papel === 'dono' ? 'Dono' : 'Colaborador'}</Badge></TableCell>
                          <TableCell><Badge className={u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plano">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Plano Atual</CardTitle>
                  {isDono && <Button size="sm" disabled>Upgrade</Button>}
                </div>
              </CardHeader>
              <CardContent>
                {loadingEsc ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary/10 text-primary text-sm px-3 py-1">{escritorio?.plano === 'gratuito' ? 'Gratuito' : escritorio?.plano ?? 'Gratuito'}</Badge>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Declarações no ano {currentYear}</p>
                      <p className="text-2xl font-bold text-foreground">{declCount ?? 0} <span className="text-sm font-normal text-muted-foreground">de {escritorio?.limite_declaracoes ?? 10}</span></p>
                      <div className="mt-2 h-2 bg-muted-foreground/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, ((declCount ?? 0) / (escritorio?.limite_declaracoes ?? 10)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracoes">
            <IntegracoesTab escritorioId={escritorioId} isDono={isDono} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
