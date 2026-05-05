
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, Users, CreditCard, Puzzle, Palette, Bell, 
  Smartphone, Building2, Save, Trash2, ShieldCheck, 
  Loader2, UserPlus, Copy, Search
} from 'lucide-react';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { WhitelabelTab } from '@/components/configuracoes/WhitelabelTab';
import { IntegracoesTab } from '@/components/configuracoes/IntegracoesTab';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatarPapel } from '@/lib/formatters';
import { SeletorPermissoes } from '@/components/configuracoes/SeletorPermissoes';

interface OfficeManagementDialogProps {
  office: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OfficeManagementDialog({ office, open, onOpenChange }: OfficeManagementDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dados');
  
  // Dados do Escritório
  const [nome, setNome] = useState(office?.nome || '');
  const [email, setEmail] = useState(office?.email || '');
  const [telefone, setTelefone] = useState(office?.telefone || '');
  const [cnpj, setCnpj] = useState(office?.cnpj || '');
  const [plano, setPlano] = useState(office?.plano || 'gratuito');
  const [limiteDeclaracoes, setLimiteDeclaracoes] = useState(office?.limite_declaracoes || 10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (office) {
      setNome(office.nome || '');
      setEmail(office.email || '');
      setTelefone(office.telefone || '');
      setCnpj(office.cnpj || '');
      setPlano(office.plano || 'gratuito');
      setLimiteDeclaracoes(office.limite_declaracoes || 10);
    }
  }, [office]);

  // Equipe
  const { data: usuarios, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'escritorio-usuarios', office?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('escritorio_id', office.id);
      if (error) throw error;
      return data;
    },
    enabled: !!office?.id && activeTab === 'equipe',
  });

  // Assinatura
  const { data: assinatura, isLoading: loadingAssinatura } = useQuery({
    queryKey: ['admin', 'escritorio-assinatura', office?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assinaturas')
        .select('*')
        .eq('escritorio_id', office.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!office?.id && activeTab === 'plano',
  });

  const handleSaveOffice = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('escritorios')
        .update({
          nome,
          email,
          telefone,
          cnpj,
          plano,
          limite_declaracoes: limiteDeclaracoes
        })
        .eq('id', office.id);

      if (error) throw error;
      toast.success('Escritório atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'escritorios'] });
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!office) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl">{office.nome}</DialogTitle>
              <DialogDescription>Gestão completa do escritório</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-48 border-r bg-muted/30 p-2 space-y-1">
            <Button 
              variant={activeTab === 'dados' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2" 
              onClick={() => setActiveTab('dados')}
            >
              <Settings className="h-4 w-4" /> Dados
            </Button>
            <Button 
              variant={activeTab === 'equipe' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2" 
              onClick={() => setActiveTab('equipe')}
            >
              <Users className="h-4 w-4" /> Equipe
            </Button>
            <Button 
              variant={activeTab === 'marca' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2" 
              onClick={() => setActiveTab('marca')}
            >
              <Palette className="h-4 w-4" /> Marca
            </Button>
            <Button 
              variant={activeTab === 'plano' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2" 
              onClick={() => setActiveTab('plano')}
            >
              <CreditCard className="h-4 w-4" /> Plano
            </Button>
            <Button 
              variant={activeTab === 'integracoes' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2" 
              onClick={() => setActiveTab('integracoes')}
            >
              <Puzzle className="h-4 w-4" /> Integrações
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'dados' && (
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Escritório</Label>
                    <Input value={nome} onChange={e => setNome(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input value={cnpj} onChange={e => setCnpj(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={telefone} onChange={e => setTelefone(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plano (Override)</Label>
                    <Input value={plano} onChange={e => setPlano(e.target.value)} placeholder="ex: pro, master" />
                  </div>
                  <div className="space-y-2">
                    <Label>Limite de Declarações</Label>
                    <Input type="number" value={limiteDeclaracoes} onChange={e => setLimiteDeclaracoes(parseInt(e.target.value))} />
                  </div>
                </div>
                <Button onClick={handleSaveOffice} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            )}

            {activeTab === 'equipe' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Membros da Equipe</h3>
                </div>
                {loadingUsers ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
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
                      {usuarios?.map((u: any) => (
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}

            {activeTab === 'marca' && (
              <WhitelabelTab escritorioId={office.id} isDono={true} />
            )}

            {activeTab === 'plano' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes da Assinatura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingAssinatura ? (
                      <Skeleton className="h-20 w-full" />
                    ) : assinatura ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Status</Label>
                          <div className="mt-1">
                            <Badge variant={assinatura.status === 'active' ? 'default' : 'destructive'}>
                              {assinatura.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Valor</Label>
                          <div className="text-lg font-bold">R$ {assinatura.valor}</div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Provider</Label>
                          <div>{assinatura.provider || 'N/A'}</div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Próxima Cobrança</Label>
                          <div>{assinatura.proxima_cobranca ? new Date(assinatura.proxima_cobranca).toLocaleDateString() : 'N/A'}</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nenhuma assinatura ativa encontrada para este escritório.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'integracoes' && (
              <IntegracoesTab escritorioId={office.id} isDono={true} />
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-muted/10">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
