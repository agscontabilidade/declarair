import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Search, Paperclip, Pin, Copy, Check, MessageSquareText, Wallet, Activity, X } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCPF, formatCurrency, STATUS_LABELS } from '@/lib/formatters';
import { DocumentosDeclaracaoModal } from '@/components/declaracoes/DocumentosDeclaracaoModal';
import { ObservacoesModal } from '@/components/declaracoes/ObservacoesModal';
import { useDebouncedInvalidate } from '@/hooks/useDebouncedInvalidate';

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(value: string | null | undefined) {
  if (!value) return { date: '—', time: '' };
  const d = new Date(value);
  return {
    date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}
import { AnexarDeclaracaoButton } from '@/components/declaracoes/AnexarDeclaracaoButton';
import { ProcessamentoSwitch, type StatusProcessamentoRfb } from '@/components/declaracoes/ProcessamentoSwitch';
import { usePermissoes } from '@/hooks/usePermissoes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Send } from 'lucide-react';
import { EnviarDeclaracaoEmailModal } from '@/components/declaracoes/EnviarDeclaracaoEmailModal';
import { ComprovacaoProcessamentoModal } from '@/components/declaracoes/ComprovacaoProcessamentoModal';

const STATUS_COLORS: Record<string, string> = {
  aguardando_documentos: 'bg-amber-100 text-amber-800',
  documentacao_recebida: 'bg-blue-100 text-blue-800',
  declaracao_pronta: 'bg-emerald-100 text-emerald-800',
  transmitida: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const RESULTADO_META: Record<string, { label: string; cls: string }> = {
  restituicao: { label: 'Restituição', cls: 'bg-emerald-100 text-emerald-800' },
  pagamento: { label: 'A pagar', cls: 'bg-amber-100 text-amber-800' },
  nenhum: { label: 'Sem imposto', cls: 'bg-gray-100 text-gray-700' },
};

function CopyCpfButton({ cpf }: { cpf: string }) {
  const [copied, setCopied] = useState(false);
  const digits = (cpf || '').replace(/\D/g, '');
  if (!digits) return null;
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(digits);
      setCopied(true);
      toast.success('CPF copiado');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-5 w-5 text-muted-foreground hover:text-emerald-600 hover:outline hover:outline-1 hover:outline-emerald-500 hover:bg-transparent"
          aria-label="Copiar CPF (sem pontos)"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>Copiar CPF (sem pontos)</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function Declaracoes() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const debouncedInvalidate = useDebouncedInvalidate(300);
  const escritorioId = profile?.escritorioId;

  const [anoBase, setAnoBase] = useState('2026');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [resultadoFiltro, setResultadoFiltro] = useState<'todos' | 'restituicao' | 'pagamento' | 'nenhum'>('todos');
  const [processoFiltro, setProcessoFiltro] = useState<'todos' | StatusProcessamentoRfb>('todos');
  const [arquivosFiltro, setArquivosFiltro] = useState<'todos' | 'completo' | 'nenhum' | 'so_declaracao' | 'so_recibo'>('todos');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [docsTarget, setDocsTarget] = useState<{ id: string; nome: string } | null>(null);
  const [obsTarget, setObsTarget] = useState<{ id: string; nome: string } | null>(null);
  const [emailTarget, setEmailTarget] = useState<DeclaracaoListaItem | null>(null);
  const [comprovTarget, setComprovTarget] = useState<DeclaracaoListaItem | null>(null);
  const { podeVerDeclaracoes } = usePermissoes();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Realtime: invalida a lista a cada mudança em declaracoes ou notas internas do escritório
  useEffect(() => {
    if (!escritorioId) return;
    const invalidate = () => debouncedInvalidate(['declaracoes-lista', escritorioId]);
    const channel = supabase
      .channel(`declaracoes-realtime-${escritorioId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'declaracoes', filter: `escritorio_id=eq.${escritorioId}` },
        invalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'declaracao_notas_internas', filter: `escritorio_id=eq.${escritorioId}` },
        invalidate
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [escritorioId, debouncedInvalidate]);

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
    arquivo_darf_url: string | null;
    arquivo_darf_nome: string | null;
    arquivo_mei_url: string | null;
    arquivo_mei_nome: string | null;
    arquivos_outros: Array<{ path: string; nome: string; uploaded_at?: string }> | null;
    recibo_validado_em: string | null;

    em_processamento: boolean | null;
    status_processamento_rfb: StatusProcessamentoRfb | null;
    declaracao_enviada_em: string | null;
    clientes: { nome: string; cpf: string; email: string } | null;
    cliente_id: string;
    clienteNome: string;
    clienteCpf: string;
    clienteEmail: string;
    observacoes: string;
    temDocsDrive: boolean;
    observacoes_cliente: string | null;
    observacoes_cliente_atualizado_em: string | null;
    observacoes_cliente_lida_em: string | null;
    comprovacao_processamento_url: string | null;
    comprovacao_processamento_nome: string | null;

  }

  const { data: declaracoes = [] as DeclaracaoListaItem[], isLoading } = useQuery({
    queryKey: ['declaracoes-lista', escritorioId, anoBase],
    queryFn: async () => {
      if (!escritorioId) return [];

      // Duas queries paralelas e enxutas em vez de uma com embed gordo:
      // 1) declarações + cliente + notas (campos usados na lista)
      // 2) ids de declarações que possuem ao menos 1 arquivo no Drive (apenas para o badge)
      const [listaRes, docsRes] = await Promise.all([
        supabase
          .from('declaracoes')
          .select(`
            id, status, ano_base, ultima_atualizacao_status, cliente_id,
            tipo_resultado, valor_resultado,
            arquivo_declaracao_url, arquivo_declaracao_nome,
            arquivo_recibo_url, arquivo_recibo_nome, recibo_validado_em,
            arquivo_mei_url, arquivo_mei_nome, mei_validado_em,
            arquivo_darf_url, arquivo_darf_nome, darf_validado_em,
            arquivos_outros,
            em_processamento, status_processamento_rfb, declaracao_enviada_em,
            comprovacao_processamento_url, comprovacao_processamento_nome,
            observacoes_cliente, observacoes_cliente_atualizado_em, observacoes_cliente_lida_em,
            clientes(nome, cpf, email),
            declaracao_notas_internas(conteudo)
          `)
          .eq('escritorio_id', escritorioId)
          .eq('ano_base', Number(anoBase))
          .order('ultima_atualizacao_status', { ascending: false })
          .limit(200),
        supabase
          .from('checklist_documentos')
          .select('declaracao_id, declaracoes!inner(escritorio_id, ano_base)')
          .eq('declaracoes.escritorio_id', escritorioId)
          .eq('declaracoes.ano_base', Number(anoBase))
          .not('arquivo_url', 'is', null),
      ]);

      if (listaRes.error) throw listaRes.error;

      const docsSet = new Set<string>(
        (docsRes.data || [])
          .map((r: { declaracao_id: string | null }) => r.declaracao_id)
          .filter((id): id is string => !!id)
      );

      return (listaRes.data || []).map((d: any) => ({
        ...d,
        status_processamento_rfb: d.status_processamento_rfb as StatusProcessamentoRfb,
        clienteNome: d.clientes?.nome || '—',
        clienteCpf: d.clientes?.cpf || '',
        clienteEmail: d.clientes?.email || '',
        observacoes: (Array.isArray(d.declaracao_notas_internas) ? d.declaracao_notas_internas[0]?.conteudo : d.declaracao_notas_internas?.conteudo) || '',
        temDocsDrive: docsSet.has(d.id),
      }));
    },
    enabled: !!escritorioId,
    staleTime: 30000, // Cache for 30 seconds
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

  const filtered = declaracoes.filter((d: DeclaracaoListaItem) => {
    if (statusFilter !== 'todos' && d.status !== statusFilter) return false;
    if (resultadoFiltro !== 'todos') {
      const tr = d.tipo_resultado ?? 'nenhum';
      if (tr !== resultadoFiltro) return false;
    }
    if (processoFiltro !== 'todos') {
      const sp = d.status_processamento_rfb ?? 'aguardando';
      if (sp !== processoFiltro) return false;
    }
    if (arquivosFiltro !== 'todos') {
      const temDec = !!d.arquivo_declaracao_url;
      const temRec = !!d.arquivo_recibo_url;
      if (arquivosFiltro === 'completo' && !(temDec && temRec)) return false;
      if (arquivosFiltro === 'nenhum' && (temDec || temRec)) return false;
      if (arquivosFiltro === 'so_declaracao' && !(temDec && !temRec)) return false;
      if (arquivosFiltro === 'so_recibo' && !(temRec && !temDec)) return false;
    }
    const term = debouncedSearch.trim().toLowerCase();
    if (term) {
      const digits = term.replace(/\D/g, '');
      const matchNome = d.clienteNome.toLowerCase().includes(term);
      const matchCpf = digits.length > 0 && d.clienteCpf.replace(/\D/g, '').includes(digits);
      if (!matchNome && !matchCpf) return false;
    }
    return true;
  });

  const hasActiveFilters =
    statusFilter !== 'todos' ||
    resultadoFiltro !== 'todos' ||
    processoFiltro !== 'todos' ||
    arquivosFiltro !== 'todos';

  const clearFilters = () => {
    setStatusFilter('todos');
    setResultadoFiltro('todos');
    setProcessoFiltro('todos');
    setArquivosFiltro('todos');
  };

  function maskCpf(cpf: string) {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length < 11) return formatCPF(cpf);
    return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Declarações</h1>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium text-muted-foreground">Ano-base</Label>
            <Select value={anoBase} onValueChange={setAnoBase}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">Ano 2026</SelectItem>
                <SelectItem value="2025">Ano 2025</SelectItem>
                <SelectItem value="2024">Ano 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium text-muted-foreground">Status</Label>
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
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium text-muted-foreground">Resultado</Label>
            <Select value={resultadoFiltro} onValueChange={(v) => setResultadoFiltro(v as typeof resultadoFiltro)}>
              <SelectTrigger className="w-[180px] gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos resultados</SelectItem>
                <SelectItem value="restituicao">Restituição</SelectItem>
                <SelectItem value="pagamento">A pagar</SelectItem>
                <SelectItem value="nenhum">Sem imposto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium text-muted-foreground">Processo (RFB)</Label>
            <Select value={processoFiltro} onValueChange={(v) => setProcessoFiltro(v as typeof processoFiltro)}>
              <SelectTrigger className="w-[190px] gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos processos</SelectItem>
                <SelectItem value="aguardando">Aguardando</SelectItem>
                <SelectItem value="processada">Processada</SelectItem>
                <SelectItem value="pendencias">Pendências</SelectItem>
                <SelectItem value="malha_fina">Malha fina</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium text-muted-foreground">Arquivos</Label>
            <Select value={arquivosFiltro} onValueChange={(v) => setArquivosFiltro(v as typeof arquivosFiltro)}>
              <SelectTrigger className="w-[210px] gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Declaração/Recibo: todos</SelectItem>
                <SelectItem value="completo">Com declaração e recibo</SelectItem>
                <SelectItem value="so_declaracao">Apenas declaração</SelectItem>
                <SelectItem value="so_recibo">Apenas recibo</SelectItem>
                <SelectItem value="nenhum">Sem arquivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[200px] max-w-sm">
            <Label className="text-xs font-medium text-muted-foreground">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
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
                {/* Desktop: tabela condensada */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead className="whitespace-nowrap">Atualizado</TableHead>
                        <TableHead>Declaração/Recibo</TableHead>
                        <TableHead>Processo</TableHead>
                        <TableHead className="text-right pr-4">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((d) => {
                        const resultado = d.tipo_resultado ? RESULTADO_META[d.tipo_resultado] : null;
                        const temObs = !!d.observacoes?.trim();
                        const dt = formatDateShort(d.ultima_atualizacao_status);
                        const podeEnviar = !!(d.arquivo_declaracao_url && d.arquivo_recibo_url);
                        const enviado = !!d.declaracao_enviada_em;
                        return (
                          <TableRow
                            key={d.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/declaracoes/${d.id}`)}
                          >
                            <TableCell className="py-2">
                              <div className="font-medium leading-tight flex items-center gap-1.5">
                                <span className="truncate">{d.clienteNome}</span>
                                {d.observacoes_cliente && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span
                                        onClick={(e) => e.stopPropagation()}
                                        className={
                                          d.observacoes_cliente_lida_em
                                            ? 'inline-flex items-center justify-center h-5 w-5 rounded-full text-amber-600 cursor-help'
                                            : 'inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500 text-white cursor-help animate-pulse'
                                        }
                                        aria-label={d.observacoes_cliente_lida_em ? 'Observação do cliente' : 'Observação do cliente não lida'}
                                      >
                                        <MessageSquareText className="h-3 w-3" />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs text-xs">
                                      <p className="font-semibold mb-1">
                                        {d.observacoes_cliente_lida_em ? 'Detalhes do cliente' : 'Detalhes do cliente (não lidos)'}
                                      </p>
                                      <p className="whitespace-pre-wrap">
                                        {d.observacoes_cliente!.length > 200
                                          ? d.observacoes_cliente!.slice(0, 200) + '…'
                                          : d.observacoes_cliente}
                                      </p>
                                      <p className="mt-1 text-muted-foreground">Abra a declaração para ler.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-xs text-muted-foreground tabular-nums">{maskCpf(d.clienteCpf)}</span>
                                <CopyCpfButton cpf={d.clienteCpf} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${STATUS_COLORS[d.status] || ''} whitespace-nowrap`}>{STATUS_LABELS[d.status] || d.status}</Badge>
                            </TableCell>
                            <TableCell>
                              {resultado ? (
                                <div className="flex flex-col gap-0.5">
                                  <Badge className={`${resultado.cls} whitespace-nowrap w-fit`}>{resultado.label}</Badge>
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
                            <TableCell className="whitespace-nowrap text-sm tabular-nums">
                              <div className="leading-tight">{dt.date}</div>
                              <div className="text-xs text-muted-foreground">{dt.time}</div>
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
                                  arquivoMeiUrl={d.arquivo_mei_url}
                                  arquivoMeiNome={d.arquivo_mei_nome}
                                  meiValidadoEm={d.mei_validado_em}
                                  arquivoDarfUrl={d.arquivo_darf_url}
                                  arquivoDarfNome={d.arquivo_darf_nome}
                                  darfValidadoEm={d.darf_validado_em}
                                  arquivosOutros={d.arquivos_outros}
                                />
                              )}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <ProcessamentoSwitch declaracaoId={d.id} status={(d.status_processamento_rfb || 'aguardando') as StatusProcessamentoRfb} />
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()} className="text-right pr-4">
                              <div className="inline-flex items-center gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant={d.temDocsDrive ? 'outline' : 'ghost'}
                                      className={`h-8 w-8 ${d.temDocsDrive ? 'border-emerald-300 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : ''}`}
                                      onClick={() => setDocsTarget({ id: d.id, nome: d.clienteNome })}
                                      aria-label="Ver documentos"
                                    >
                                      <Paperclip className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver documentos</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className={`h-8 w-8 ${temObs ? 'text-emerald-600 hover:text-emerald-700' : ''}`}
                                      onClick={() => setObsTarget({ id: d.id, nome: d.clienteNome })}
                                      aria-label={temObs ? 'Ver observações' : 'Adicionar observação'}
                                    >
                                      <Pin className={`h-4 w-4 ${temObs ? 'fill-emerald-100' : ''}`} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[260px]">
                                    {temObs ? d.observacoes : 'Adicionar observação'}
                                  </TooltipContent>
                                </Tooltip>

                                {podeEnviar ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant={enviado ? 'ghost' : 'outline'}
                                        className={`h-8 w-8 ${enviado ? 'text-emerald-600 hover:text-emerald-700' : 'border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEmailTarget(d);
                                        }}
                                        aria-label={enviado ? 'Reenviar e-mail' : 'Enviar e-mail'}
                                      >
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>

                                    <TooltipContent>
                                      {enviado ? `Reenviar (enviado em ${formatDateTime(d.declaracao_enviada_em)})` : 'Enviar declaração ao cliente'}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="inline-block h-8 w-8" aria-hidden />
                                )}
                              </div>
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
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-foreground truncate">{d.clienteNome}</p>
                                {d.observacoes_cliente && (
                                  <span
                                    className={
                                      d.observacoes_cliente_lida_em
                                        ? 'inline-flex items-center justify-center h-5 w-5 rounded-full text-amber-600 shrink-0'
                                        : 'inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-500 text-white shrink-0 animate-pulse'
                                    }
                                    aria-label="Observação do cliente"
                                  >
                                    <MessageSquareText className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <p className="text-xs text-muted-foreground tabular-nums">{maskCpf(d.clienteCpf)}</p>
                                <CopyCpfButton cpf={d.clienteCpf} />
                              </div>
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
                            className={`justify-start ${d.temDocsDrive ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700' : ''}`}
                          >
                            <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                            Documentos
                          </Button>
                          {d.arquivo_declaracao_url && d.arquivo_recibo_url && (
                            <Button
                              size="sm"
                              variant={d.declaracao_enviada_em ? "ghost" : "outline"}
                              className={d.declaracao_enviada_em ? "text-emerald-600 hover:text-emerald-700" : "border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"}
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
                              <Pin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{d.observacoes}</span>
                            </button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setObsTarget({ id: d.id, nome: d.clienteNome })}
                              className="justify-start"
                            >
                              <Pin className="h-3.5 w-3.5 mr-1.5" />
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
                              arquivoMeiUrl={d.arquivo_mei_url}
                              arquivoMeiNome={d.arquivo_mei_nome}
                              meiValidadoEm={d.mei_validado_em}
                              arquivoDarfUrl={d.arquivo_darf_url}
                              arquivoDarfNome={d.arquivo_darf_nome}
                              darfValidadoEm={d.darf_validado_em}
                                  arquivosOutros={d.arquivos_outros}
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
          arquivoDarfUrl={emailTarget.arquivo_darf_url}
          arquivoDarfNome={emailTarget.arquivo_darf_nome}
          arquivoMeiUrl={emailTarget.arquivo_mei_url}
          arquivoMeiNome={emailTarget.arquivo_mei_nome}
          arquivosOutros={emailTarget.arquivos_outros}

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
