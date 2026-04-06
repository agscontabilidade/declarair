import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Key, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PlanGate, FeatureGate } from '@/components/billing/BillingGate';

export default function ConfiguracoesAPI() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [apiKeyGerada, setApiKeyGerada] = useState('');

  const escritorioId = profile.escritorioId;
  const isDono = profile.papel === 'dono';

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ['api-keys', escritorioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('escritorio_id', escritorioId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!escritorioId && isDono,
  });

  const gerarKey = useMutation({
    mutationFn: async (nome: string) => {
      const key = `dk_${crypto.randomUUID().replace(/-/g, '')}`;
      const keyPrefix = key.substring(0, 12);

      const encoder = new TextEncoder();
      const data = encoder.encode(key);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase
        .from('api_keys')
        .insert({
          escritorio_id: escritorioId!,
          nome,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          created_by: user?.id,
        });

      if (error) throw error;
      return key;
    },
    onSuccess: (key) => {
      setApiKeyGerada(key);
      toast.success('API Key gerada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: () => toast.error('Erro ao gerar API Key'),
  });

  const revogarKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ ativo: false })
        .eq('id', keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('API Key revogada');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
  });

  const copiarKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Copiado!');
  };

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-v1`;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">API Keys</h1>
          <p className="text-muted-foreground">Gerencie chaves de acesso para integração externa</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chaves de API</CardTitle>
                <CardDescription>
                  Use estas chaves para integrar sistemas externos com o DeclaraIR
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) { setApiKeyGerada(''); setNovoNome(''); }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Key className="mr-2 h-4 w-4" />
                    Gerar Nova Chave
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Gerar Nova API Key</DialogTitle>
                    <DialogDescription>
                      Esta chave dará acesso à API REST do seu escritório.
                    </DialogDescription>
                  </DialogHeader>
                  {apiKeyGerada ? (
                    <div className="space-y-4">
                      <p className="text-sm text-destructive font-semibold">
                        ⚠️ Copie esta chave agora! Ela não será mostrada novamente.
                      </p>
                      <div className="flex gap-2">
                        <Input value={apiKeyGerada} readOnly className="font-mono text-sm" />
                        <Button onClick={() => copiarKey(apiKeyGerada)} size="icon" variant="outline">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button onClick={() => setDialogOpen(false)} className="w-full">
                        Fechar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Nome da Chave</label>
                        <Input
                          value={novoNome}
                          onChange={(e) => setNovoNome(e.target.value)}
                          placeholder="Ex: Integração Sistema X"
                        />
                      </div>
                      <Button
                        onClick={() => gerarKey.mutate(novoNome)}
                        disabled={!novoNome.trim() || gerarKey.isPending}
                        className="w-full"
                      >
                        {gerarKey.isPending ? 'Gerando...' : 'Gerar Chave'}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Prefixo</TableHead>
                    <TableHead>Último Uso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key: any) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.nome}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{key.key_prefix}...</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.ultimo_uso
                          ? new Date(key.ultimo_uso).toLocaleString('pt-BR')
                          : 'Nunca'}
                      </TableCell>
                      <TableCell>
                        {key.ativo ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Revogada</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {key.ativo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Revogar esta API key? Esta ação não pode ser desfeita.')) {
                                revogarKey.mutate(key.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {apiKeys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma API key gerada ainda
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentação da API</CardTitle>
            <CardDescription>Como integrar sistemas externos com o DeclaraIR</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Base URL</h3>
              <div className="flex items-center gap-2">
                <code className="bg-muted text-sm p-2 rounded block flex-1 overflow-x-auto">{baseUrl}</code>
                <Button variant="outline" size="icon" onClick={() => copiarKey(baseUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Autenticação</h3>
              <p className="text-sm text-muted-foreground mb-2">Inclua a API key no header:</p>
              <code className="bg-muted text-sm p-2 rounded block">X-API-Key: dk_sua_chave_aqui</code>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Endpoints</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs w-14 justify-center">GET</Badge>
                  <code className="bg-muted px-2 py-1 rounded">/clientes</code>
                  <span className="text-muted-foreground">— Listar clientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs w-14 justify-center">GET</Badge>
                  <code className="bg-muted px-2 py-1 rounded">/clientes/:id</code>
                  <span className="text-muted-foreground">— Detalhe do cliente</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs w-14 justify-center bg-emerald-50">POST</Badge>
                  <code className="bg-muted px-2 py-1 rounded">/clientes</code>
                  <span className="text-muted-foreground">— Criar cliente (nome, cpf obrigatórios)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs w-14 justify-center">GET</Badge>
                  <code className="bg-muted px-2 py-1 rounded">/declaracoes</code>
                  <span className="text-muted-foreground">— Listar declarações</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs w-14 justify-center bg-emerald-50">POST</Badge>
                  <code className="bg-muted px-2 py-1 rounded">/declaracoes</code>
                  <span className="text-muted-foreground">— Criar declaração (cliente_id, ano_base obrigatórios)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs w-14 justify-center">GET</Badge>
                  <code className="bg-muted px-2 py-1 rounded">/cobrancas</code>
                  <span className="text-muted-foreground">— Listar cobranças</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs w-14 justify-center bg-emerald-50">POST</Badge>
                  <code className="bg-muted px-2 py-1 rounded">/cobrancas</code>
                  <span className="text-muted-foreground">— Criar cobrança</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Paginação</h3>
              <p className="text-sm text-muted-foreground">
                Todos os endpoints GET aceitam <code className="bg-muted px-1 rounded">?page=0&limit=50</code> (máx 100 por página).
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Exemplo com cURL</h3>
              <pre className="bg-muted text-sm p-3 rounded overflow-x-auto">
{`curl -H "X-API-Key: dk_sua_chave" \\
  ${baseUrl}/clientes`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
