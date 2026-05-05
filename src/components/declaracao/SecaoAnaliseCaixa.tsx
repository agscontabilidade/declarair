import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, Upload, FileCheck, Loader2, Lock, Brain, ScanSearch, 
  Eye, Trash2, RotateCcw, ChevronDown, ChevronUp, History, 
  AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { FileViewerModal, type ViewerFile } from '@/components/drive/FileViewerModal';
import { VisualIAFiscal } from './VisualIAFiscal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';

interface Props {
  declaracaoId: string;
}

const MAX_SIZE = 18 * 1024 * 1024;

const HeaderInfo = ({ content }: { content: string }) => (
  <TooltipProvider>
    <UITooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3 w-3 text-muted-foreground/50 cursor-help" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[200px] p-2 text-[10px] leading-tight">
        {content}
      </TooltipContent>
    </UITooltip>
  </TooltipProvider>
);

export function SecaoAnaliseCaixa({ declaracaoId }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { features, loading: billingLoading } = useBillingStatus();

  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);
  const [analiseRecenteId, setAnaliseRecenteId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [analiseSelecionadaId, setAnaliseSelecionadaId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: declaracao } = useQuery({
    queryKey: ['decl-analise-caixa', declaracaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('declaracoes')
        .select('id, escritorio_id, cliente_id, arquivo_analise_caixa_url, arquivo_analise_caixa_uploaded_at')
        .eq('id', declaracaoId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Busca histórico de análises
  const { data: historicoAnalises, isLoading: carregandoHistorico } = useQuery({
    queryKey: ['analise-caixa-historico', declaracaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('declaracao_analises')
        .select('id, resultado_texto, veredito, resumo_visual, updated_at, created_at')
        .eq('declaracao_id', declaracaoId)
        .eq('tipo', 'analise_caixa')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const analiseAtual = historicoAnalises?.find(a => a.id === analiseSelecionadaId) || 
                       historicoAnalises?.find(a => a.id === analiseRecenteId) ||
                       (historicoAnalises && historicoAnalises.length > 0 ? historicoAnalises[0] : null);

  const detaleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analiseAtual) {
      setResultado(analiseAtual.resultado_texto);
      setUltimaAtualizacao(analiseAtual.updated_at);
      // Só scrolla se o usuário clicou explicitamente (analiseSelecionadaId está setado)
      if (analiseSelecionadaId) {
        setTimeout(() => {
          detaleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else if (!loading) {
      // Se não há análise selecionada nem recém-criada, limpa o resultado
      setResultado('');
    }
  }, [analiseAtual, loading, analiseSelecionadaId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!declaracao?.escritorio_id || !declaracao?.cliente_id) throw new Error('Declaração inválida');
      if (file.size > MAX_SIZE) throw new Error('Arquivo muito grande (máx. 18MB)');
      if (file.type !== 'application/pdf') throw new Error('Apenas PDF é aceito');

      const path = `${declaracao.escritorio_id}/${declaracao.cliente_id}/_analise_caixa/${declaracaoId}.pdf`;
      const { error: upErr } = await supabase.storage
        .from('documentos-clientes')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' });
      if (upErr) throw upErr;

      const { error: updErr } = await supabase
        .from('declaracoes')
        .update({
          arquivo_analise_caixa_url: path,
          arquivo_analise_caixa_uploaded_at: new Date().toISOString(),
        })
        .eq('id', declaracaoId);
      if (updErr) throw updErr;
    },
    onSuccess: () => {
      toast.success('PDF carregado para análise');
      queryClient.invalidateQueries({ queryKey: ['decl-analise-caixa', declaracaoId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!declaracao?.arquivo_analise_caixa_url) return;
      await supabase.storage.from('documentos-clientes').remove([declaracao.arquivo_analise_caixa_url]);
      await supabase
        .from('declaracoes')
        .update({ arquivo_analise_caixa_url: null, arquivo_analise_caixa_uploaded_at: null })
        .eq('id', declaracaoId);
      
      await supabase
        .from('declaracao_analises')
        .delete()
        .eq('declaracao_id', declaracaoId)
        .eq('tipo', 'analise_caixa');
    },
    onSuccess: () => {
      toast.success('PDF e análise removidos');
      setResultado('');
      setUltimaAtualizacao(null);
      queryClient.invalidateQueries({ queryKey: ['decl-analise-caixa', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['analise-caixa-persistida', declaracaoId] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  async function executarAnalise(force = false) {
    setLoading(true);
    setResultado('');
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ia-fiscal`;
      const resp = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          declaracao_id: declaracaoId, 
          tipo: 'analise_caixa',
          force_refresh: force 
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      const contentType = resp.headers.get('Content-Type');
      if (contentType?.includes('application/json')) {
        const data = await resp.json();
        if (data.choices?.[0]?.delta?.content) {
          setResultado(data.choices[0].delta.content);
          setUltimaAtualizacao(data.updated_at);
          return;
        }
      }

      if (!resp.body) throw new Error('Stream não disponível');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          queryClient.invalidateQueries({ queryKey: ['analise-caixa-historico', declaracaoId] });
          setAnaliseSelecionadaId(null); 
          // Busca a ID da análise que acabou de ser criada para mostrar no detalhe
          const { data: novaAnalise } = await supabase
            .from('declaracao_analises')
            .select('id')
            .eq('declaracao_id', declaracaoId)
            .eq('tipo', 'analise_caixa')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (novaAnalise) setAnaliseRecenteId(novaAnalise.id);
          queryClient.invalidateQueries({ queryKey: ['analise-caixa-historico', declaracaoId] });
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              full += c;
              setResultado(full);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (e: unknown) {
      if (((e) as { name?: unknown }).name !== 'AbortError') {
        setResultado(`❌ Erro: ${getErrorMessage(e)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (billingLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!features.calculadora_ir) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">Análise de Caixa — Recurso Pro</p>
          <p className="text-sm text-muted-foreground mb-4">A análise inteligente da declaração está disponível apenas no plano Pro.</p>
          <Button size="sm" onClick={() => navigate('/meus-planos')}>Fazer Upgrade</Button>
        </AlertDescription>
      </Alert>
    );
  }

  const temPdf = !!declaracao?.arquivo_analise_caixa_url;

  const viewerFiles: ViewerFile[] = temPdf ? [{
    id: 'analise-caixa',
    arquivo_url: declaracao!.arquivo_analise_caixa_url!,
    arquivo_nome: 'Declaração para análise de caixa.pdf',
  }] : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-accent" />
              Análise de Caixa
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Suba a declaração antes de transmitir. A IA do DeclaraIR irá ler, interpretar e identificar
              estouro de caixa e inconsistências.
              <br />
              <span className="text-amber-600 font-medium">Este PDF não é compartilhado com o Drive nem com o cliente.</span>
            </p>
          </div>
          {ultimaAtualizacao && (
            <Badge variant="secondary" className="text-[10px] h-5">
              Última análise: {new Date(ultimaAtualizacao).toLocaleDateString('pt-BR')}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = '';
            }}
          />

          {temPdf ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-9 w-9 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">Declaração carregada</p>
                  <p className="text-[11px] text-muted-foreground">
                    Enviada em {declaracao?.arquivo_analise_caixa_uploaded_at && new Date(declaracao.arquivo_analise_caixa_uploaded_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setViewerOpen(true)}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Visualizar
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Substituir
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate()} disabled={remove.isPending} title="Remover">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {upload.isPending ? 'Enviando...' : 'Clique para subir o PDF da declaração'}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {!resultado ? (
              <Button
                className="gap-2 w-full"
                onClick={() => executarAnalise(false)}
                disabled={loading || !temPdf}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                {loading ? 'Analisando...' : 'Executar Análise de Caixa'}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="gap-2 w-full border-accent/20 hover:bg-accent/5"
                onClick={() => executarAnalise(true)}
                disabled={loading || !temPdf}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 text-accent" />}
                Atualizar Análise (IA)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Histórico de Análises */}
      {historicoAnalises && historicoAnalises.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 flex flex-row items-center justify-between bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" /> Histórico de Análises
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">Últimas verificações técnicas realizadas pela IA</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-[10px] gap-1.5 ml-2"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['analise-caixa-historico', declaracaoId] });
                  toast.success('Lista de análises atualizada');
                }}
              >
                <RotateCcw className="h-3 w-3" /> Atualizar Lista
              </Button>
            </div>
            <Badge variant="outline" className="font-normal">{historicoAnalises.length} {historicoAnalises.length === 1 ? 'análise' : 'análises'}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="w-[180px] text-[11px] uppercase font-bold">
                    <div className="flex items-center gap-1">
                      Data e Hora
                      <HeaderInfo content="Data e hora exata em que a análise foi processada pela nossa inteligência artificial." />
                    </div>
                  </TableHead>
                  <TableHead className="text-[11px] uppercase font-bold">
                    <div className="flex items-center gap-1">
                      Veredito
                      <HeaderInfo content="Parecer conclusivo da IA. 'Transmitir' indica fluxo de caixa coerente. 'Ajustar' sugere revisão de valores. 'Bloqueado' indica inconsistência grave que geraria malha fiscal imediata." />
                    </div>
                  </TableHead>
                  <TableHead className="text-[11px] uppercase font-bold text-right">
                    <div className="flex items-center justify-end gap-1">
                      Saldo de Caixa
                      <HeaderInfo content="Diferença entre Origens e Aplicações. Exemplo: Se você ganhou R$ 100k (Origem) mas gastou/investiu R$ 120k (Aplicação), o saldo será negativo de -R$ 20k (Estouro), o que é um risco alto de malha fina." />
                    </div>
                  </TableHead>
                  <TableHead className="text-[11px] uppercase font-bold text-center">
                    <div className="flex items-center justify-center gap-1">
                      Riscos
                      <HeaderInfo content="Nível de criticidade dos alertas. Vermelho: Erros estruturais ou patrimoniais. Amarelo: Alertas de inconsistência leve ou cruzamento de dados. Verde: Dados dentro dos parâmetros de normalidade da Receita." />
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px] text-[11px] uppercase font-bold text-right pr-4">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoAnalises.map((analise) => {
                  const resumo = analise.resumo_visual as any;
                  const isSelected = analiseSelecionadaId === analise.id || (analiseSelecionadaId === null && analiseRecenteId === null && index === 0);
                  const veredito = analise.veredito;
                  
                  const formatCurrency = (value: number) => {
                    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
                  };

                  return (
                    <TableRow 
                      key={analise.id}
                    className={`cursor-pointer transition-colors hover:bg-muted/40 ${isSelected || (analiseRecenteId === analise.id) ? 'bg-primary/5' : ''}`}
                    onClick={() => {
                      setAnaliseRecenteId(null);
                      setAnaliseSelecionadaId(isSelected ? null : analise.id);
                    }}
                    >
                      <TableCell className="font-medium text-xs">
                        <div className="flex flex-col">
                          <span>{new Date(analise.created_at || '').toLocaleDateString('pt-BR')}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(analise.created_at || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {veredito === 'transmitir' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Transmitir
                          </Badge>
                        ) : veredito === 'ajustar' ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-[10px] gap-1">
                            <AlertCircle className="h-3 w-3" /> Ajustar
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/10 border-destructive/20 text-[10px] gap-1">
                            <XCircle className="h-3 w-3" /> Bloqueado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={`text-xs font-semibold text-right ${resumo?.estouro ? 'text-destructive' : 'text-emerald-600'}`}>
                        {resumo?.saldo !== undefined ? formatCurrency(resumo.saldo) : '---'}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1.5">
                          {resumo?.riscos ? (
                            <>
                              {resumo.riscos.alto > 0 && <span className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_5px_rgba(239,68,68,0.5)] animate-pulse" title={`${resumo.riscos.alto} Crítico`} />}
                              {resumo.riscos.medio > 0 && <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]" title={`${resumo.riscos.medio} Alerta`} />}
                              {resumo.riscos.baixo >= 0 && <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" title="Normal" />}
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic">Processando...</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                          {isSelected ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(loading || resultado || carregandoHistorico) && (
        <Card id="analise-detalhada" ref={detaleRef} className="scroll-mt-6 border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Brain className="h-3 w-3" /> Análise Detalhada
                </Badge>
                {(loading || carregandoHistorico) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                setAnaliseSelecionadaId(null);
                setAnaliseRecenteId(null);
              }} className="h-6 text-xs text-muted-foreground">
                Recolher
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            {resultado ? (
              <VisualIAFiscal resultado={resultado} />
            ) : (
              <span className="text-muted-foreground animate-pulse text-sm">
                {carregandoHistorico ? 'Recuperando histórico...' : 'Lendo declaração e cruzando com o cadastro...'}
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <FileViewerModal
        files={viewerFiles}
        currentId={viewerOpen ? 'analise-caixa' : null}
        onClose={() => setViewerOpen(false)}
        onChange={() => {}}
      />
    </div>
  );
}
