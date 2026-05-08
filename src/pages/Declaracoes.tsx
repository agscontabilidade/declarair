import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Search, FolderOpen, StickyNote } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCPF, formatCurrency, STATUS_LABELS } from '@/lib/formatters';
import { DocumentosDeclaracaoModal } from '@/components/declaracoes/DocumentosDeclaracaoModal';
import { ObservacoesModal } from '@/components/declaracoes/ObservacoesModal';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
import { AnexarDeclaracaoButton } from '@/components/declaracoes/AnexarDeclaracaoButton';
import { ProcessamentoSwitch, type StatusProcessamentoRfb } from '@/components/declaracoes/ProcessamentoSwitch';
import { usePermissoes } from '@/hooks/usePermissoes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Send } from 'lucide-react';
import { EnviarDeclaracaoEmailModal } from '@/components/declaracoes/EnviarDeclaracaoEmailModal';

const STATUS_COLORS: Record<string, string> = {
  aguardando_documentos: 'bg-amber-100 text-amber-800',
  documentacao_recebida: 'bg-blue-100 text-blue-800',
  declaracao_pronta: 'bg-emerald-100 text-emerald-800',
  transmitida: 'bg-gray-100 text-gray-700',
};

const RESULTADO_META: Record<string, { label: string; cls: string }> = {
  restituicao: { label: 'Restituição', cls: 'bg-emerald-100 text-emerald-800' },
  pagamento: { label: 'A pagar', cls: 'bg-amber-100 text-amber-800' },
  nenhum: { label: 'Sem imposto', cls: 'bg-gray-100 text-gray-700' },
};

export default function Declaracoes() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const escritorioId = profile?.escritorioId;

  const [anoBase, setAnoBase] = useState('2026');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [docsTarget, setDocsTarget] = useState<{ id: string; nome: string } | null>(null);
  const [obsTarget, setObsTarget] = useState<{ id: string; nome: string } | null>(null);
  const [emailTarget, setEmailTarget] = useState<DeclaracaoListaItem | null>(null);
  const { podeVerDeclaracoes } = usePermissoes();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Realtime: invalida a lista a cada mudança em declaracoes do escritório
  useEffect(() => {
    if (!escritorioId) return;
    const channel = supabase
      .channel(`declaracoes-realtime-${escritorioId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'declaracoes', filter: `escritorio_id=eq.${escritorioId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['declaracoes-lista', escritorioId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [escritorioId, queryClient]);

  interface DeclaracaoListaItem {
    id: string;
    status: string;
    ano_base: number;
    ultima_atualizacao_status: string | null;
    tipo_resultado: string | null;
    valor_resultado: number | null;
    arquivo_declaracao_url: string | null;
    arquivo_declaracao_nome: string | null;
    arquivo_recibo_url: string | null;
    arquivo_recibo_nome: string | null;
    recibo_validado_em: string | null;
    em_processamento: boolean | null;
    status_processamento_rfb: StatusProcessamentoRfb | null;
    declaracao_enviada_em: string | null;
    clientes: { nome: string; cpf: string; email: string } | null;
    clienteNome: string;
    clienteCpf: string;
    clienteEmail: string;
    observacoes: string;
  }

  const { data: declaracoes = [] as DeclaracaoListaItem[], isLoading } = useQuery({
    queryKey: ['declaracoes-lista', escritorioId, anoBase],
    queryFn: async () => {
      if (!escritorioId) return [];
      const { data, error } = await supabase
        .from('declaracoes')
        .select(`
          id, status, ano_base, ultima_atualizacao_status,
          tipo_resultado, valor_resultado,
          arquivo_declaracao_url, arquivo_declaracao_nome,
          arquivo_recibo_url, arquivo_recibo_nome, recibo_validado_em,
          em_processamento, status_processamento_rfb, declaracao_enviada_em,
          clientes(nome, cpf, email)
        `)
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', Number(anoBase))
        .order('ultima_atualizacao_status', { ascending: false });
      if (error) throw error;

      const ids = (data || []).map((d: { id: string }) => d.id);
      const notasMap = new Map<string, string>();
      if (ids.length > 0) {
        const { data: notas } = await supabase
          .from('declaracao_notas_internas')
          .select('declaracao_id, conteudo')
          .in('declaracao_id', ids);
        (notas || []).forEach((n: { declaracao_id: string; conteudo: string | null }) => {
          if (n.conteudo?.trim()) notasMap.set(n.declaracao_id, n.conteudo);
        });
      }

      return (data || []).map((d) => ({
        ...d,
        status_processamento_rfb: d.status_processamento_rfb as StatusProcessamentoRfb,
        clienteNome: d.clientes?.nome || '—',
        clienteCpf: d.clientes?.cpf || '',
        clienteEmail: d.clientes?.email || '',
        observacoes: notasMap.get(d.id) || '',
      }));
    },
    enabled: !!escritorioId,
  });

  if (!podeVerDeclaracoes) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Declarações</h1>
          <Alert variant="destructive" className="max-w-md">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acesso negado</AlertTitle>
            <AlertDescription>Você não tem permissão para visualizar declarações.</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const filtered = declaracoes.filter((d: { status: string; clienteCpf: string; clienteNome: string }) => {
    if (statusFilter !== 'todos' && d.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const cpfDigits = d.clienteCpf.replace(/\D/g, '');
      if (!d.clienteNome.toLowerCase().includes(s) && !cpfDigits.includes(s.replace(/\D/g, ''))) return false;
    }
    return true;
  });

  function maskCpf(cpf: string) {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length < 11) return formatCPF(cpf);
    return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Declarações</h1>

        <div className="flex flex-wrap gap-3">
          <Select value={anoBase} onValueChange={setAnoBase}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">Ano 2026</SelectItem>
              <SelectItem value="2025">Ano 2025</SelectItem>
              <SelectItem value="2024">Ano 2024</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="aguardando_documentos">Aguardando Documentos</SelectItem>
              <SelectItem value="documentacao_recebida">Documentação Recebida</SelectItem>
              <SelectItem value="declaracao_pronta">Declaração Pronta</SelectItem>
              <SelectItem value="transmitida">Transmitida</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">Nenhuma declaração encontrada</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Crie declarações pelo Dashboard ou perfil do cliente</p>
              </div>
            ) : (
              <>
                {/* Desktop: tabela com scroll horizontal se necessário */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table className="min-w-[1100px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>CPF</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ver documentos</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead className="whitespace-nowrap">Última atualização</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Anexar declaração</TableHead>
                        <TableHead>Processamento</TableHead>
                        <TableHead>Enviar E-mail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((d) => {
                        const resultado = d.tipo_resultado ? RESULTADO_META[d.tipo_resultado] : null;
                        const temObs = !!d.observacoes?.trim();
                        return (
                          <TableRow
                            key={d.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/declaracoes/${d.id}`)}
                          >
                            <TableCell className="tabular-nums whitespace-nowrap">{maskCpf(d.clienteCpf)}</TableCell>
                            <TableCell className="font-medium">{d.clienteNome}</TableCell>
                            <TableCell>
                              <Badge className={`${STATUS_COLORS[d.status] || ''} whitespace-nowrap`}>{STATUS_LABELS[d.status] || d.status}</Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDocsTarget({ id: d.id, nome: d.clienteNome })}
                                className="whitespace-nowrap"
                              >
                                <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                                Documentos
                              </Button>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {temObs ? (
                                <button
                                  type="button"
                                  onClick={() => setObsTarget({ id: d.id, nome: d.clienteNome })}
                                  className="inline-flex items-center gap-1.5 max-w-[220px] rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                                  title={d.observacoes}
                                >
                                  <StickyNote className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{d.observacoes}</span>
                                </button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setObsTarget({ id: d.id, nome: d.clienteNome })}
                                  className="whitespace-nowrap"
                                >
                                  <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                                  Adicionar
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {formatDateTime(d.ultima_atualizacao_status)}
                            </TableCell>
                            <TableCell>
                              {resultado ? (
                                <div className="flex flex-col gap-1">
                                  <Badge className={`${resultado.cls} whitespace-nowrap`}>{resultado.label}</Badge>
                                  {d.valor_resultado != null && d.tipo_resultado !== 'nenhum' && (
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                      {formatCurrency(Number(d.valor_resultado))}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {escritorioId && (
                                <AnexarDeclaracaoButton
                                  declaracaoId={d.id}
                                  escritorioId={escritorioId}
                                  arquivoUrl={d.arquivo_declaracao_url}
                                  arquivoNome={d.arquivo_declaracao_nome}
                                  arquivoReciboUrl={d.arquivo_recibo_url}
                                  arquivoReciboNome={d.arquivo_recibo_nome}
                                  reciboValidadoEm={d.recibo_validado_em}
                                />
                              )}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <ProcessamentoSwitch declaracaoId={d.id} status={(d.status_processamento_rfb || 'aguardando') as StatusProcessamentoRfb} />
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {d.arquivo_declaracao_url && d.arquivo_recibo_url && (
                                <Button
                                  size="sm"
                                  variant={d.declaracao_enviada_em ? "ghost" : "default"}
                                  className={d.declaracao_enviada_em ? "text-emerald-600 hover:text-emerald-700" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEmailTarget(d);
                                  }}
                                  title={d.declaracao_enviada_em ? `Enviado em ${formatDateTime(d.declaracao_enviada_em)}` : "Enviar para o cliente"}
                                >
                                  <Send className="h-3.5 w-3.5 mr-1.5" />
                                  {d.declaracao_enviada_em ? 'Reenviar' : 'Enviar'}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile/Tablet: cards empilhados */}
                <div className="lg:hidden divide-y">
                  {filtered.map((d) => {
                    const resultado = d.tipo_resultado ? RESULTADO_META[d.tipo_resultado] : null;
                    const temObs = !!d.observacoes?.trim();
                    return (
                      <div key={d.id} className="p-4 space-y-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/declaracoes/${d.id}`)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">{d.clienteNome}</p>
                              <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{maskCpf(d.clienteCpf)}</p>
                            </div>
                            <Badge className={`${STATUS_COLORS[d.status] || ''} whitespace-nowrap shrink-0`}>
                              {STATUS_LABELS[d.status] || d.status}
                            </Badge>
                          </div>
                        </button>

                        <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
                          <span className="truncate">{formatDateTime(d.ultima_atualizacao_status)}</span>
                          {resultado && (
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={`${resultado.cls} whitespace-nowrap`}>{resultado.label}</Badge>
                              {d.valor_resultado != null && d.tipo_resultado !== 'nenhum' && (
                                <span className="tabular-nums">{formatCurrency(Number(d.valor_resultado))}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDocsTarget({ id: d.id, nome: d.clienteNome })}
                            className="justify-start"
                          >
                            <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                            Documentos
                          </Button>
                          {d.arquivo_declaracao_url && d.arquivo_recibo_url && (
                            <Button
                              size="sm"
                              variant={d.declaracao_enviada_em ? "ghost" : "default"}
                              className={d.declaracao_enviada_em ? "text-emerald-600 hover:text-emerald-700" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEmailTarget(d);
                              }}
                            >
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              {d.declaracao_enviada_em ? 'Reenviar' : 'Enviar'}
                            </Button>
                          )}
                          {temObs ? (
                            <button
                              type="button"
                              onClick={() => setObsTarget({ id: d.id, nome: d.clienteNome })}
                              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors min-w-0"
                              title={d.observacoes}
                            >
                              <StickyNote className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{d.observacoes}</span>
                            </button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setObsTarget({ id: d.id, nome: d.clienteNome })}
                              className="justify-start"
                            >
                              <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                              Observações
                            </Button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {escritorioId && (
                            <AnexarDeclaracaoButton
                              declaracaoId={d.id}
                              escritorioId={escritorioId}
                              arquivoUrl={d.arquivo_declaracao_url}
                              arquivoNome={d.arquivo_declaracao_nome}
                              arquivoReciboUrl={d.arquivo_recibo_url}
                              arquivoReciboNome={d.arquivo_recibo_nome}
                              reciboValidadoEm={d.recibo_validado_em}
                            />
                          )}
                          <ProcessamentoSwitch declaracaoId={d.id} status={(d.status_processamento_rfb || 'aguardando') as StatusProcessamentoRfb} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <DocumentosDeclaracaoModal
        declaracaoId={docsTarget?.id ?? null}
        clienteNome={docsTarget?.nome}
        open={!!docsTarget}
        onOpenChange={(o) => !o && setDocsTarget(null)}
      />
      <ObservacoesModal
        declaracaoId={obsTarget?.id ?? null}
        escritorioId={escritorioId}
        clienteNome={obsTarget?.nome}
        open={!!obsTarget}
        onOpenChange={(o) => !o && setObsTarget(null)}
      />
      {emailTarget && (
        <EnviarDeclaracaoEmailModal
          declaracaoId={emailTarget.id}
          clienteNome={emailTarget.clienteNome}
          clienteEmail={emailTarget.clienteEmail}
          anoBase={emailTarget.ano_base}
          arquivoDeclaracaoUrl={emailTarget.arquivo_declaracao_url}
          arquivoDeclaracaoNome={emailTarget.arquivo_declaracao_nome}
          arquivoReciboUrl={emailTarget.arquivo_recibo_url}
          arquivoReciboNome={emailTarget.arquivo_recibo_nome}
          open={!!emailTarget}
          onOpenChange={(o) => !o && setEmailTarget(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] });
          }}
        />
      )}
    </DashboardLayout>
  );
}
