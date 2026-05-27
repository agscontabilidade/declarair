import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BellRing, Search, Mail, MessageCircle, ShieldAlert } from 'lucide-react';
import { useLembretesPendentes } from '@/hooks/useLembretesPendentes';
import { useWhatsAppStatus } from '@/hooks/useWhatsApp';
import { LembreteEnvioModal } from '@/components/lembretes/LembreteEnvioModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { QueryError } from '@/components/ui/QueryError';
import { usePermissoes } from '@/hooks/usePermissoes';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const WHATSAPP_ADDON_ID = '6a5bab9f-a9d1-4ae4-9925-8fd8a25fbf3f';

function formatDateBR(iso: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR'); } catch { return '—'; }
}

export default function Lembretes() {
  const { profile } = useAuth();
  const { data: pendentes = [], isLoading, isError, error, refetch } = useLembretesPendentes();
  const whatsappStatus = useWhatsAppStatus();
  const { podeVerClientes } = usePermissoes();

  // Verifica addon WhatsApp ativo
  const { data: whatsappAddon } = useQuery({
    queryKey: ['whatsapp-addon', profile?.escritorioId],
    queryFn: async () => {
      if (!profile?.escritorioId) return false;
      const { data } = await supabase
        .from('escritorio_addons')
        .select('id')
        .eq('escritorio_id', profile.escritorioId)
        .eq('addon_id', WHATSAPP_ADDON_ID)
        .eq('status', 'ativo')
        .maybeSingle();
      return !!data;
    },
    enabled: !!profile?.escritorioId,
    staleTime: 5 * 60_000,
  });
  const whatsappAtivo = !!whatsappAddon && whatsappStatus.data?.status === 'connected';

  const [search, setSearch] = useState('');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [canalInicial, setCanalInicial] = useState<'email' | 'whatsapp'>('email');
  const [clienteUnicoId, setClienteUnicoId] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pendentes;
    return pendentes.filter((c) => c.nome.toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q));
  }, [pendentes, search]);

  const todosSelecionados = filtrados.length > 0 && filtrados.every((c) => selecionados.has(c.id));
  const algumSelecionado = selecionados.size > 0;

  const toggleTodos = () => {
    if (todosSelecionados) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(filtrados.map((c) => c.id)));
    }
  };

  const toggleUm = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const abrirEnvioMassa = (canal: 'email' | 'whatsapp') => {
    setClienteUnicoId(null);
    setCanalInicial(canal);
    setModalOpen(true);
  };

  const abrirEnvioIndividual = (id: string, canal: 'email' | 'whatsapp') => {
    setClienteUnicoId(id);
    setCanalInicial(canal);
    setModalOpen(true);
  };

  if (!podeVerClientes) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Lembretes IR</h1>
          <Alert variant="destructive" className="max-w-md">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acesso negado</AlertTitle>
            <AlertDescription>Você não tem permissão para acessar esta tela.</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Lembretes IR</h1>
          <QueryError message={error?.message} onRetry={() => refetch()} />
        </div>
      </DashboardLayout>
    );
  }

  const selecionadosArr = pendentes.filter((c) => selecionados.has(c.id));

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <BellRing className="h-6 w-6 text-primary" />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Lembretes de prazo IR</h1>
              <p className="text-sm text-muted-foreground">
                {pendentes.length} cliente(s) aguardando documentos
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={todosSelecionados}
                      onCheckedChange={toggleTodos}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Canais</TableHead>
                  <TableHead>Última atualização</TableHead>
                  <TableHead>Último lembrete</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                )}
                {!isLoading && filtrados.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente aguardando documentos. 🎉
                  </TableCell></TableRow>
                )}
                {filtrados.map((c) => (
                  <TableRow key={c.id} data-state={selecionados.has(c.id) ? 'selected' : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selecionados.has(c.id)}
                        onCheckedChange={() => toggleUm(c.id)}
                        aria-label={`Selecionar ${c.nome}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{c.nome}</div>
                      <div className="text-xs text-muted-foreground">{c.email || 'sem email'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Badge variant={c.email ? 'default' : 'outline'} className="gap-1">
                          <Mail className="h-3 w-3" /> {c.email ? '✓' : '✗'}
                        </Badge>
                        <Badge variant={c.telefone ? 'default' : 'outline'} className="gap-1">
                          <MessageCircle className="h-3 w-3" /> {c.telefone ? '✓' : '✗'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateBR(c.ultima_atualizacao_status)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.ultimo_lembrete_em ? (
                        <span className="text-muted-foreground">
                          {formatDateBR(c.ultimo_lembrete_em)} · {c.ultimo_lembrete_canal}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          disabled={!c.email}
                          title="Enviar email"
                          onClick={() => abrirEnvioIndividual(c.id, 'email')}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          disabled={!c.telefone}
                          title="Enviar WhatsApp"
                          onClick={() => abrirEnvioIndividual(c.id, 'whatsapp')}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {algumSelecionado && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{selecionados.size} selecionado(s)</span>
            <Button size="sm" variant="outline" onClick={() => setSelecionados(new Set())}>Limpar</Button>
            <Button size="sm" onClick={() => abrirEnvioMassa('email')} className="gap-1">
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button size="sm" variant="secondary" onClick={() => abrirEnvioMassa('whatsapp')} className="gap-1">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
          </div>
        </div>
      )}

      <LembreteEnvioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clientes={clienteUnicoId ? pendentes : selecionadosArr}
        whatsappAtivo={whatsappAtivo}
        canalInicial={canalInicial}
        clienteUnicoId={clienteUnicoId}
      />
    </DashboardLayout>
  );
}
