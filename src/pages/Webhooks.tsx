import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PlanGate, FeatureGate } from '@/components/billing/BillingGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Webhook, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const EVENTOS_DISPONIVEIS = [
  { value: 'declaracao.criada', label: 'Declaração criada' },
  { value: 'declaracao.status_alterado', label: 'Status da declaração alterado' },
  { value: 'declaracao.transmitida', label: 'Declaração transmitida' },
  { value: 'cliente.criado', label: 'Cliente criado' },
  { value: 'cobranca.criada', label: 'Cobrança criada' },
  { value: 'cobranca.paga', label: 'Cobrança paga' },
  { value: 'documento.recebido', label: 'Documento recebido' },
];

export default function WebhooksPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEventos, setSelectedEventos] = useState<string[]>([]);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const escritorioId = profile.escritorioId;
  const isDono = profile.papel === 'dono';

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks', escritorioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhooks' as any)
        .select('*')
        .eq('escritorio_id', escritorioId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!escritorioId,
  });

  const criarWebhook = useMutation({
    mutationFn: async () => {
      const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;
      const { error } = await supabase
        .from('webhooks' as any)
        .insert({
          escritorio_id: escritorioId!,
          url,
          eventos: selectedEventos,
          secret,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Webhook criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      setDialogOpen(false);
      setUrl('');
      setSelectedEventos([]);
    },
    onError: () => toast.error('Erro ao criar webhook'),
  });

  const deletarWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhooks' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Webhook removido');
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  const toggleEvento = (evento: string) => {
    setSelectedEventos(prev =>
      prev.includes(evento) ? prev.filter(e => e !== evento) : [...prev, evento]
    );
  };

  return (
    <DashboardLayout>
      <PlanGate requiredPlan="pro" featureName="Webhooks">
        <FeatureGate feature="api_publica">
          <div className="space-y-6 max-w-5xl">
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">Webhooks</h1>
              <p className="text-muted-foreground">Receba notificações em tempo real sobre eventos do sistema</p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Endpoints Configurados</CardTitle>
                    <CardDescription>Gerencie suas URLs de callback para receber eventos</CardDescription>
                  </div>
                  {isDono && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Webhook</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar Webhook</DialogTitle>
                          <DialogDescription>Configure uma URL para receber eventos do sistema</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>URL do Endpoint</Label>
                            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://seu-sistema.com/webhook" />
                          </div>
                          <div>
                            <Label className="mb-2 block">Eventos</Label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {EVENTOS_DISPONIVEIS.map(ev => (
                                <div key={ev.value} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={selectedEventos.includes(ev.value)}
                                    onCheckedChange={() => toggleEvento(ev.value)}
                                  />
                                  <span className="text-sm">{ev.label}</span>
                                  <code className="text-xs text-muted-foreground ml-auto">{ev.value}</code>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                          <Button
                            onClick={() => criarWebhook.mutate()}
                            disabled={!url.trim() || selectedEventos.length === 0 || criarWebhook.isPending}
                          >
                            {criarWebhook.isPending ? 'Criando...' : 'Criar Webhook'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>URL</TableHead>
                        <TableHead>Eventos</TableHead>
                        <TableHead>Secret</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhooks.map((wh: any) => (
                        <TableRow key={wh.id}>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate">{wh.url}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(wh.eventos || []).slice(0, 2).map((e: string) => (
                                <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                              ))}
                              {(wh.eventos || []).length > 2 && (
                                <Badge variant="secondary" className="text-[10px]">+{wh.eventos.length - 2}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <code className="text-xs">{showSecret[wh.id] ? wh.secret : 'whsec_••••••••'}</code>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSecret(p => ({ ...p, [wh.id]: !p[wh.id] }))}>
                                {showSecret[wh.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(wh.secret); toast.success('Copiado!'); }}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={wh.ativo ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : ''} variant={wh.ativo ? 'outline' : 'secondary'}>
                              {wh.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isDono && (
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => { if (confirm('Remover este webhook?')) deletarWebhook.mutate(wh.id); }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {webhooks.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum webhook configurado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle>Como funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="text-muted-foreground">Quando um evento ocorre, enviamos um POST para sua URL com:</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{`{
  "evento": "declaracao.status_alterado",
  "timestamp": "2026-04-07T12:00:00Z",
  "dados": {
    "declaracao_id": "uuid",
    "status_anterior": "aguardando_documentos",
    "status_novo": "documentacao_recebida",
    "cliente": { "id": "uuid", "nome": "João" }
  }
}`}</pre>
                <p className="text-muted-foreground">
                  Cada requisição inclui o header <code className="bg-muted px-1 rounded">X-Webhook-Signature</code> com um HMAC-SHA256 do payload usando seu secret.
                </p>
              </CardContent>
            </Card>
          </div>
        </FeatureGate>
      </PlanGate>
    </DashboardLayout>
  );
}
