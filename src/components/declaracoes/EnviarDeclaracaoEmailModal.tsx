import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Loader2, FileText, Receipt, Users, RotateCcw, History, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ArquivoOutro {
  path: string;
  nome: string;
  uploaded_at?: string;
}

interface Props {
  declaracaoId: string;
  clienteNome: string;
  clienteEmail: string;
  anoBase: number;
  arquivoDeclaracaoUrl: string | null;
  arquivoDeclaracaoNome: string | null;
  arquivoReciboUrl: string | null;
  arquivoReciboNome: string | null;
  arquivoDarfUrl?: string | null;
  arquivoDarfNome?: string | null;
  arquivoMeiUrl?: string | null;
  arquivoMeiNome?: string | null;
  arquivosOutros?: ArquivoOutro[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}


export function EnviarDeclaracaoEmailModal({
  declaracaoId,
  clienteNome,
  clienteEmail,
  anoBase,
  arquivoDeclaracaoUrl,
  arquivoDeclaracaoNome,
  arquivoReciboUrl,
  arquivoReciboNome,
  arquivoDarfUrl,
  arquivoDarfNome,
  arquivoMeiUrl,
  arquivoMeiNome,
  arquivosOutros,

  open,
  onOpenChange,
  onSuccess
}: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [nomeEscritorio, setNomeEscritorio] = useState('Seu Contador');
  const [chavePix, setChavePix] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [cobrancaValor, setCobrancaValor] = useState<number | null>(null);
  const [resultado, setResultado] = useState<{ tipo: string | null; valor: number | null } | null>(null);
  const [emailsCopia, setEmailsCopia] = useState('');
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState(false);
  const [ultimaMensagemCarregada, setUltimaMensagemCarregada] = useState(false);

  const MAX_CC = 5;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function parseEmails(raw: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    const clientLower = (clienteEmail || '').toLowerCase();
    raw.split(/[,;\s]+/).forEach((e) => {
      const t = e.trim();
      if (!t) return;
      const k = t.toLowerCase();
      if (k === clientLower) return;
      if (seen.has(k)) return;
      seen.add(k);
      out.push(t);
    });
    return out;
  }

  function fmtBRL(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  useEffect(() => {
    if (mensagemPersonalizada) return;

    const partes = ['a cópia da declaração', 'o respectivo recibo de entrega'];
    if (arquivoDarfUrl) partes.push('o DARF para pagamento');
    if (arquivoMeiUrl) partes.push('a Declaração do MEI (DASN-SIMEI)');
    const anexosTxt =
      partes.length === 1
        ? partes[0]
        : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;

    const blocos: string[] = [];
    blocos.push(`Prezado(a) ${clienteNome},`);
    blocos.push(`Sua Declaração de Imposto de Renda ${anoBase} foi transmitida com sucesso.`);
    blocos.push(`Seguem em anexo ${anexosTxt}.`);

    if (resultado?.tipo) {
      const valorFmt = resultado.valor != null ? fmtBRL(Number(resultado.valor)) : null;
      let resumoResultado = '';
      if (resultado.tipo === 'restituicao' && valorFmt) {
        resumoResultado = `Restituição de ${valorFmt}`;
      } else if ((resultado.tipo === 'pagamento' || resultado.tipo === 'imposto_a_pagar') && valorFmt) {
        resumoResultado = `Imposto a pagar de ${valorFmt}`;
      } else {
        resumoResultado = 'Sem imposto a pagar nem restituição';
      }
      blocos.push(`**Resultado da declaração:** **${resumoResultado}**`);
    }

    if (cobrancaValor != null) {
      blocos.push(`**Valor da declaração:** **${fmtBRL(cobrancaValor)}**`);
    }

    if (chavePix && cobrancaValor != null) {
      blocos.push(`**Chave Pix para pagamento:** **${chavePix}**`);
    }

    blocos.push('Ficamos à disposição para qualquer dúvida.');
    blocos.push('Obrigado pela confiança mais um ano.');

    const assinante = profile?.nome || nomeEscritorio;
    blocos.push(`Atenciosamente,\n**${assinante}**`);

    setMensagem(blocos.join('\n\n'));
  }, [clienteNome, anoBase, cobrancaValor, arquivoDarfUrl, arquivoMeiUrl, mensagemPersonalizada, resultado, chavePix, profile?.nome, nomeEscritorio]);

  // Carrega a última mensagem enviada (se houver) ao abrir o modal
  useEffect(() => {
    if (!open || !declaracaoId) return;
    setUltimaMensagemCarregada(false);
    setMensagemPersonalizada(false);
    (async () => {
      const { data } = await supabase
        .from('declaracoes')
        .select('ultima_mensagem_email, tipo_resultado, valor_resultado')
        .eq('id', declaracaoId)
        .maybeSingle();
      if (data) {
        setResultado({
          tipo: data.tipo_resultado ?? null,
          valor: data.valor_resultado != null ? Number(data.valor_resultado) : null,
        });
        if (data.ultima_mensagem_email) {
          setMensagem(data.ultima_mensagem_email);
          setMensagemPersonalizada(true);
          setUltimaMensagemCarregada(true);
        }
      }
    })();
  }, [open, declaracaoId]);

  useEffect(() => {
    if (!open || !declaracaoId) return;
    (async () => {
      const { data } = await supabase
        .from('cobrancas')
        .select('valor')
        .eq('declaracao_id', declaracaoId)
        .neq('status', 'cancelado')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setCobrancaValor(data ? Number(data.valor) : null);
    })();
  }, [open, declaracaoId]);

  useEffect(() => {
    async function loadEscritorio() {
      if (!profile?.escritorioId) return;
      const { data } = await supabase
        .rpc('get_escritorio_safe_data', { esc_id: profile.escritorioId })
        .maybeSingle();
      if (data?.nome) setNomeEscritorio(data.nome);
      setChavePix(data?.chave_pix ?? null);
    }
    loadEscritorio();
  }, [profile?.escritorioId]);

  const handleEnviar = async () => {
    if (!clienteEmail) {
      toast.error('Cliente não possui e-mail cadastrado.');
      return;
    }

    const ccList = parseEmails(emailsCopia);
    const invalido = ccList.find((e) => !EMAIL_REGEX.test(e));
    if (invalido) {
      toast.error(`E-mail de cópia inválido: ${invalido}`);
      return;
    }
    if (ccList.length > MAX_CC) {
      toast.error(`Máximo de ${MAX_CC} e-mails em cópia.`);
      return;
    }

    setLoading(true);
    try {
      const attachmentPaths = [];
      if (arquivoDeclaracaoUrl) {
        attachmentPaths.push({
          filename: arquivoDeclaracaoNome || `Declaracao_IRPF_${anoBase}.pdf`,
          path: arquivoDeclaracaoUrl
        });
      }
      if (arquivoReciboUrl) {
        attachmentPaths.push({
          filename: arquivoReciboNome || `Recibo_IRPF_${anoBase}.pdf`,
          path: arquivoReciboUrl
        });
      }
      if (arquivoDarfUrl) {
        attachmentPaths.push({
          filename: arquivoDarfNome || `DARF_IRPF_${anoBase}.pdf`,
          path: arquivoDarfUrl
        });
      }
      if (arquivoMeiUrl) {
        attachmentPaths.push({
          filename: arquivoMeiNome || `Declaracao_MEI_DASN_SIMEI_${anoBase}.pdf`,
          path: arquivoMeiUrl
        });
      }
      (arquivosOutros || []).forEach((o) => {
        if (o?.path) {
          attachmentPaths.push({ filename: o.nome || 'documento', path: o.path });
        }
      });


      const templateData = {
        nomeCliente: clienteNome,
        nomeEscritorio: nomeEscritorio,
        anoBase: String(anoBase),
        mensagemPersonalizada: mensagem
      };

      const { data, error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'envio-manual-declaracao',
          recipientEmail: clienteEmail,
          templateData,
          attachmentPaths
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('E-mail enviado com sucesso para a fila de processamento.');

      // Envia cópias em paralelo (não bloqueia sucesso principal)
      if (ccList.length > 0) {
        const results = await Promise.allSettled(
          ccList.map((email) =>
            supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'envio-manual-declaracao',
                recipientEmail: email,
                templateData,
                attachmentPaths
              }
            }).then((r) => {
              if (r.error) throw r.error;
              if (r.data?.error) throw new Error(r.data.error);
              return r;
            })
          )
        );
        const falhas = results
          .map((r, i) => (r.status === 'rejected' ? ccList[i] : null))
          .filter((e): e is string => !!e);
        if (falhas.length > 0) {
          toast.warning(`Falha ao enviar cópia para: ${falhas.join(', ')}`);
        } else {
          toast.success(`Cópia enviada para ${ccList.length} e-mail(s).`);
        }
      }

      // Registrar que a declaração foi enviada + guarda a mensagem para próxima vez
      await supabase
        .from('declaracoes')
        .update({
          declaracao_enviada_em: new Date().toISOString(),
          ultima_mensagem_email: mensagem,
          ultima_mensagem_email_em: new Date().toISOString(),
        })
        .eq('id', declaracaoId);

      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Erro ao enviar e-mail:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar e-mail');
    } finally {
      setLoading(false);
    }
  };

  const ccChips = useMemo(() => parseEmails(emailsCopia), [emailsCopia]);

  const anexos = [
    arquivoDeclaracaoUrl && {
      nome: arquivoDeclaracaoNome || 'Declaração.pdf',
      tipo: 'Declaração',
      icon: FileText,
      tone: 'bg-primary/10 text-primary',
    },
    arquivoReciboUrl && {
      nome: arquivoReciboNome || 'Recibo.pdf',
      tipo: 'Recibo',
      icon: Receipt,
      tone: 'bg-emerald-500/10 text-emerald-600',
    },
    arquivoDarfUrl && {
      nome: arquivoDarfNome || 'DARF.pdf',
      tipo: 'DARF',
      icon: FileText,
      tone: 'bg-amber-500/10 text-amber-600',
    },
    arquivoMeiUrl && {
      nome: arquivoMeiNome || 'Declaração MEI (DASN-SIMEI).pdf',
      tipo: 'MEI',
      icon: FileText,
      tone: 'bg-blue-500/10 text-blue-600',
    },
    ...((arquivosOutros || []).map((o) => ({
      nome: o.nome || 'Documento',
      tipo: 'Outro',
      icon: FileText,
      tone: 'bg-slate-500/10 text-slate-600',
    }))),
  ].filter(Boolean) as Array<{ nome: string; tipo: string; icon: typeof FileText; tone: string }>;


  const valorFmt = cobrancaValor != null
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobrancaValor)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold font-display leading-tight">
                Enviar Declaração por E-mail
              </h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <span>Para</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-foreground max-w-[260px] truncate">
                  {clienteEmail}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="rounded-full font-normal">
                  IRPF {anoBase}
                </Badge>
                {valorFmt && (
                  <Badge variant="success" className="rounded-full font-normal">
                    Valor: {valorFmt}
                  </Badge>
                )}
                <Badge variant="outline" className="rounded-full font-normal gap-1">
                  <Paperclip className="h-3 w-3" />
                  {anexos.length} {anexos.length === 1 ? 'anexo' : 'anexos'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Mensagem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mensagem" className="text-sm font-medium">Mensagem do e-mail</Label>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {mensagem.length} caracteres
              </span>
            </div>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => {
                setMensagem(e.target.value);
                setMensagemPersonalizada(true);
              }}
              placeholder="Digite a mensagem que será enviada no corpo do e-mail..."
              className="min-h-[180px] resize-none rounded-xl border-border/70 leading-relaxed text-[13.5px] focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <div className="flex items-center justify-between min-h-[24px]">
              {ultimaMensagemCarregada ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <History className="h-3 w-3" />
                  Última mensagem enviada carregada
                </span>
              ) : <span />}
              {mensagemPersonalizada && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-primary hover:text-primary"
                  onClick={() => {
                    setMensagemPersonalizada(false);
                    setUltimaMensagemCarregada(false);
                  }}
                  disabled={loading}
                  aria-label="Restaurar mensagem padrão"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Restaurar padrão
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Dica: use <code className="px-1 rounded bg-muted text-foreground">**texto**</code> para destacar trechos em <strong>negrito</strong> no e-mail.
            </p>
          </div>

          {/* CC */}
          <div className="rounded-xl border border-dashed border-border/70 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="emails-copia" className="text-sm font-medium">
                Enviar cópia para
              </Label>
              <span className="text-[11px] text-muted-foreground">(opcional)</span>
            </div>
            <Input
              id="emails-copia"
              type="text"
              value={emailsCopia}
              onChange={(e) => setEmailsCopia(e.target.value)}
              placeholder="email1@exemplo.com, email2@exemplo.com"
              disabled={loading}
              className="rounded-lg"
            />
            {ccChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {ccChips.map((email) => {
                  const valid = EMAIL_REGEX.test(email);
                  return (
                    <span
                      key={email}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        valid
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {email}
                    </span>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Separe múltiplos e-mails por vírgula (máx. {MAX_CC}).
            </p>
          </div>

          {/* Anexos */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Documentos inclusos
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {anexos.length} {anexos.length === 1 ? 'arquivo' : 'arquivos'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {anexos.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 hover:border-primary/40 transition-colors"
                  >
                    <div className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${a.tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate leading-tight">{a.nome}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{a.tipo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground hidden sm:block">
            Envio assíncrono — pode levar alguns segundos.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleEnviar} disabled={loading} className="shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Confirmar e Enviar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
