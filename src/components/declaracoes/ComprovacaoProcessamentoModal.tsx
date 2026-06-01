import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { pdfjs } from 'react-pdf';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

type AnaliseStatus =
  | 'idle'
  | 'analisando'
  | 'match'
  | 'mismatch_cpf'
  | 'mismatch_nome'
  | 'sem_texto'
  | 'erro';

interface AnaliseResultado {
  status: AnaliseStatus;
  cpfEncontrado?: string;
  mensagem?: string;
}

function normalizarNome(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatCpf(d: string): string {
  const x = d.replace(/\D/g, '').padStart(11, '0').slice(0, 11);
  return `${x.slice(0, 3)}.${x.slice(3, 6)}.${x.slice(6, 9)}-${x.slice(9, 11)}`;
}

async function extrairTextoPdf(file: File): Promise<{ texto: string; digitos: string }> {
  const buf = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: buf });
  const pdf = await loadingTask.promise;
  let texto = '';
  let digitos = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strs = (content.items as Array<{ str?: string }>).map((it) => it?.str || '');
    texto += '\n' + strs.join(' ');
    // Concatena sem separadores — pdf.js às vezes quebra dígitos do CPF em items distintos
    digitos += strs.join('').replace(/\D/g, '');
  }
  return { texto, digitos };
}

async function analisarPdfContribuinte(
  file: File,
  clienteCpf: string | null,
  clienteNome: string,
): Promise<AnaliseResultado> {
  try {
    const { texto, digitos } = await extrairTextoPdf(file);
    if ((!texto || texto.replace(/\s/g, '').length < 20) && digitos.length < 11) {
      return { status: 'sem_texto' };
    }

    const cpfEsperadoDigits = (clienteCpf || '').replace(/\D/g, '');

    // 1) tenta achar CPFs formatados (com pontos/traço/espaços)
    const formatRe = /\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}/g;
    const matches = Array.from(texto.matchAll(formatRe)).map((m) => m[0].replace(/\D/g, ''));

    let cpfOk = false;
    let cpfEncontrado: string | undefined;
    if (cpfEsperadoDigits.length === 11) {
      cpfOk = matches.some((m) => m === cpfEsperadoDigits);
      // 2) fallback: procura a sequência de 11 dígitos no stream concatenado
      if (!cpfOk && digitos.includes(cpfEsperadoDigits)) {
        cpfOk = true;
      }
      if (!cpfOk && matches.length > 0) cpfEncontrado = matches[0];
    } else {
      cpfOk = true; // sem CPF de referência, não bloqueia
    }

    const textoNorm = normalizarNome(texto);
    const nomeNorm = normalizarNome(clienteNome || '');
    let nomeOk = false;
    if (nomeNorm.length >= 3) {
      if (textoNorm.includes(nomeNorm)) {
        nomeOk = true;
      } else {
        // Match por tokens: aceita se ≥60% dos tokens significativos do nome aparecem
        const partes = nomeNorm.split(' ').filter((p) => p.length >= 3);
        if (partes.length > 0) {
          const tokensTexto = new Set(textoNorm.split(' ').filter(Boolean));
          const presentes = partes.filter((p) => tokensTexto.has(p) || textoNorm.includes(p));
          const ratio = presentes.length / partes.length;
          const primeiro = partes[0];
          const ultimo = partes[partes.length - 1];
          nomeOk =
            ratio >= 0.6 ||
            (partes.length >= 2 && textoNorm.includes(primeiro) && textoNorm.includes(ultimo));
        }
      }
    } else {
      nomeOk = true;
    }

    if (!cpfOk) {
      return {
        status: 'mismatch_cpf',
        cpfEncontrado,
        mensagem: cpfEncontrado
          ? `CPF do PDF (${formatCpf(cpfEncontrado)}) não confere com o do cliente (${formatCpf(cpfEsperadoDigits)}).`
          : `Nenhum CPF correspondente a ${formatCpf(cpfEsperadoDigits)} foi encontrado no PDF.`,
      };
    }
    if (!nomeOk) {
      return {
        status: 'mismatch_nome',
        mensagem: `O nome "${clienteNome}" não foi localizado no documento.`,
      };
    }
    return { status: 'match' };
  } catch (e) {
    console.error('Falha ao analisar PDF:', e);
    return { status: 'erro', mensagem: 'Não foi possível analisar o PDF.' };
  }
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  declaracaoId: string | null;
  clienteId: string | null;
  clienteNome: string;
  clienteCpf?: string | null;
  clienteEmail: string | null;
  escritorioId: string | null;
  anoBase: number;
  /** Path do arquivo já existente (para reenvio/substituição). */
  comprovacaoExistenteUrl?: string | null;
  comprovacaoExistenteNome?: string | null;
  onSuccess?: () => void;
}

export function ComprovacaoProcessamentoModal({
  open,
  onOpenChange,
  declaracaoId,
  clienteId,
  clienteNome,
  clienteCpf,
  clienteEmail,
  escritorioId,
  anoBase,
  comprovacaoExistenteUrl,
  comprovacaoExistenteNome,
  onSuccess,
}: Props) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [enviarEmail, setEnviarEmail] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [nomeEscritorio, setNomeEscritorio] = useState('Seu Contador');
  const [analise, setAnalise] = useState<AnaliseResultado>({ status: 'idle' });
  const [overrideMismatch, setOverrideMismatch] = useState(false);
  const isReenvio = !!comprovacaoExistenteUrl;

  // Carrega nome do escritório e mensagem padrão ao abrir
  useEffect(() => {
    if (!open) return;
    setFile(null);
    setEnviarEmail(true);
    setAnalise({ status: 'idle' });
    setOverrideMismatch(false);
    const padrao =
      `Sua Declaração de Imposto de Renda ${anoBase} foi **processada com sucesso e sem pendências pela Receita Federal**.\n\n` +
      `Em anexo o documento que comprova o processamento. Você também pode baixá-lo pelo botão abaixo.\n\n` +
      `Ficamos à disposição para qualquer dúvida.`;
    setMensagem(padrao);

    (async () => {
      if (!profile?.escritorioId) return;
      const { data } = await supabase
        .rpc('get_escritorio_safe_data', { esc_id: profile.escritorioId })
        .maybeSingle();
      if (data?.nome) setNomeEscritorio(data.nome);
    })();
  }, [open, clienteNome, anoBase, profile?.escritorioId]);

  // Reanalisa o PDF sempre que um novo arquivo for selecionado
  useEffect(() => {
    if (!file) {
      setAnalise({ status: 'idle' });
      setOverrideMismatch(false);
      return;
    }
    let cancelled = false;
    setAnalise({ status: 'analisando' });
    setOverrideMismatch(false);
    (async () => {
      const res = await analisarPdfContribuinte(file, clienteCpf ?? null, clienteNome);
      if (!cancelled) setAnalise(res);
    })();
    return () => {
      cancelled = true;
    };
  }, [file, clienteCpf, clienteNome]);

  function pickFile(f: File | null) {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são aceitos.');
      return;
    }
    if (f.size > MAX_SIZE) {
      toast.error('Arquivo muito grande (máx. 10MB).');
      return;
    }
    setFile(f);
  }


  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    pickFile(f);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0] ?? null;
    pickFile(f);
  }

  async function handleConfirm() {
    if (!declaracaoId || !clienteId || !escritorioId) {
      toast.error('Dados da declaração indisponíveis.');
      return;
    }
    if (!file) {
      toast.error('Selecione o PDF de comprovação.');
      return;
    }
    if (enviarEmail && !clienteEmail) {
      toast.error('Cliente não possui e-mail cadastrado. Desmarque o envio de e-mail para continuar.');
      return;
    }

    setLoading(true);
    let checklistId: string | null = null;
    let storagePath: string | null = null;

    try {
      // 1) Cria linha em checklist_documentos para obter o id
      const nomeSemExt = file.name.replace(/\.[^/.]+$/, '');
      const { data: inserted, error: insertErr } = await supabase
        .from('checklist_documentos')
        .insert({
          declaracao_id: declaracaoId,
          categoria: 'contador',
          nome_documento: nomeSemExt,
          obrigatorio: false,
          status: 'recebido',
          arquivo_nome: file.name,
          data_recebimento: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (insertErr || !inserted) throw insertErr || new Error('Falha ao registrar documento');
      checklistId = inserted.id;

      // 2) Upload no storage
      storagePath = `${escritorioId}/${clienteId}/${inserted.id}/${file.name}`;
      const { error: upErr } = await supabase.storage
        .from('documentos-clientes')
        .upload(storagePath, file, { upsert: true, contentType: 'application/pdf' });
      if (upErr) throw upErr;

      // 3) Atualiza arquivo_url
      const { error: updErr } = await supabase
        .from('checklist_documentos')
        .update({ arquivo_url: storagePath })
        .eq('id', inserted.id);
      if (updErr) throw updErr;

      // 4) Atualiza declaracoes
      const { error: declErr } = await supabase
        .from('declaracoes')
        .update({
          status_processamento_rfb: 'processada',
          em_processamento: true,
          comprovacao_processamento_url: storagePath,
          comprovacao_processamento_nome: file.name,
          comprovacao_processamento_uploaded_at: new Date().toISOString(),
        })
        .eq('id', declaracaoId);
      if (declErr) throw declErr;

      toast.success(
        isReenvio
          ? 'Comprovação substituída com sucesso.'
          : 'Comprovação salva e disponibilizada no Drive do cliente.',
      );

      // 5) Envia e-mail (fila — não bloqueia o sucesso principal)
      if (enviarEmail && clienteEmail) {
        try {
          const { data, error } = await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'processamento-receita-confirmado',
              recipientEmail: clienteEmail,
              escritorioId: profile?.escritorioId,
              idempotencyKey: `comprov-proc-${declaracaoId}-${Date.now()}`,
              templateData: {
                nomeCliente: clienteNome,
                nomeEscritorio,
                anoBase: String(anoBase),
                mensagemPersonalizada: mensagem,
              },
              attachmentPaths: [
                {
                  filename: file.name,
                  path: storagePath,
                },
              ],
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          await supabase
            .from('declaracoes')
            .update({ comprovacao_processamento_enviada_em: new Date().toISOString() })
            .eq('id', declaracaoId);

          toast.success('E-mail enviado ao cliente.');
        } catch (mailErr) {
          console.error('Erro ao enviar e-mail de comprovação:', mailErr);
          toast.warning('Comprovação salva, mas não foi possível enviar o e-mail. Tente reenviar mais tarde.');
        }
      }

      queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['drive-docs'] });

      onSuccess?.();
      onOpenChange(false);
    } catch (err: unknown) {
      console.error('Erro na comprovação de processamento:', err);
      // Rollback do checklist (e tentativa de remover o arquivo se subiu)
      if (checklistId) {
        if (storagePath) {
          try {
            await supabase.storage.from('documentos-clientes').remove([storagePath]);
          } catch { /* ignore */ }
        }
        try {
          await supabase.from('checklist_documentos').delete().eq('id', checklistId);
        } catch { /* ignore */ }
      }
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar comprovação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Comprovação de processamento
          </DialogTitle>
          <DialogDescription>
            Anexe o PDF emitido pela Receita Federal que comprova o processamento da declaração de{' '}
            <strong>{clienteNome}</strong> ({anoBase}). Ele será salvo no Drive do cliente
            {enviarEmail ? ' e enviado por e-mail.' : '.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isReenvio && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Já existe uma comprovação registrada (<strong>{comprovacaoExistenteNome}</strong>).
                Enviar uma nova adicionará outro arquivo ao Drive do cliente.
              </AlertDescription>
            </Alert>
          )}

          {/* Upload area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center transition hover:border-primary/50 hover:bg-muted/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-emerald-600" />
                <div className="text-left">
                  <p className="text-sm font-medium truncate max-w-[280px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  disabled={loading}
                  aria-label="Remover arquivo"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium">Clique ou arraste o PDF aqui</p>
                <p className="text-xs text-muted-foreground">Apenas PDF, até 10MB</p>
              </div>
            )}
          </div>

          {/* Análise automática do PDF (CPF + Nome) */}
          {file && (
            <>
              {analise.status === 'analisando' && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Analisando documento...</span>
                </div>
              )}
              {analise.status === 'match' && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-emerald-800">Documento confere</p>
                    <p className="text-emerald-700 text-xs mt-0.5">
                      CPF e nome do contribuinte correspondem a <strong>{clienteNome}</strong>
                      {clienteCpf ? ` (${formatCpf(clienteCpf)})` : ''}.
                    </p>
                  </div>
                </div>
              )}
              {(analise.status === 'mismatch_cpf' || analise.status === 'mismatch_nome') && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm space-y-2">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-900">
                        Descasamento de informação no PDF
                      </p>
                      <p className="text-amber-800 text-xs mt-0.5">{analise.mensagem}</p>
                      <p className="text-amber-800 text-xs mt-1">
                        Esperado: <strong>{clienteNome}</strong>
                        {clienteCpf ? ` — ${formatCpf(clienteCpf)}` : ''}.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pl-8">
                    <Checkbox
                      id="override-mismatch"
                      checked={overrideMismatch}
                      onCheckedChange={(v) => setOverrideMismatch(!!v)}
                      disabled={loading}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="override-mismatch"
                      className="text-xs text-amber-900 cursor-pointer leading-snug"
                    >
                      Verifiquei manualmente e confirmo que o documento pertence a este cliente.
                    </Label>
                  </div>
                </div>
              )}
              {analise.status === 'sem_texto' && (
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground text-xs">
                    Não foi possível ler o texto do PDF automaticamente (pode ser um documento escaneado).
                    Verifique manualmente se o CPF e o nome correspondem ao cliente antes de enviar.
                  </p>
                </div>
              )}
              {analise.status === 'erro' && (
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-muted-foreground text-xs">
                    {analise.mensagem || 'Falha ao analisar o PDF.'} Verifique manualmente antes de enviar.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Toggle e-mail */}
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <Checkbox
              id="enviar-email"
              checked={enviarEmail}
              onCheckedChange={(v) => setEnviarEmail(!!v)}
              disabled={loading}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <Label htmlFor="enviar-email" className="text-sm font-medium cursor-pointer">
                Enviar e-mail ao cliente com o anexo
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {clienteEmail ? (
                  <>
                    Para: <span className="font-medium text-foreground">{clienteEmail}</span>
                  </>
                ) : (
                  <span className="text-amber-600">Cliente sem e-mail cadastrado</span>
                )}
              </p>
            </div>
            <Badge variant="outline" className="text-[10px]">PDF anexo + link</Badge>
          </div>

          {/* Mensagem */}
          {enviarEmail && (
            <div className="space-y-2">
              <Label htmlFor="mensagem-comprov" className="text-sm font-medium">
                Mensagem do e-mail
              </Label>
              <Textarea
                id="mensagem-comprov"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="min-h-[140px] text-[13.5px] leading-relaxed resize-none"
                disabled={loading}
              />
              <p className="text-[11px] text-muted-foreground">
                Use <code className="px-1 rounded bg-muted">**texto**</code> para destacar em <strong>negrito</strong>.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              loading ||
              !file ||
              analise.status === 'analisando' ||
              ((analise.status === 'mismatch_cpf' || analise.status === 'mismatch_nome') && !overrideMismatch)
            }
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Confirmar processamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
