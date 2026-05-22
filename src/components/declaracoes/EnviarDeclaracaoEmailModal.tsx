import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Mail, Loader2, FileText, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  open,
  onOpenChange,
  onSuccess
}: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [nomeEscritorio, setNomeEscritorio] = useState('Seu Contador');
  const [mensagem, setMensagem] = useState('');
  const [cobrancaValor, setCobrancaValor] = useState<number | null>(null);
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

  useEffect(() => {
    let cobrancaLinha = '';
    if (cobrancaValor != null) {
      const valorFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cobrancaValor);
      cobrancaLinha = `\n\nO valor da declaração é: ${valorFmt}.`;
    }
    const anexosTxt = arquivoDarfUrl
      ? 'a cópia da declaração, o respectivo recibo de entrega e o DARF para pagamento'
      : 'a cópia da declaração e o respectivo recibo de entrega';
    setMensagem(
      `Prezado(a) ${clienteNome},\n\nSua Declaração de Imposto de Renda ${anoBase} foi transmitida com sucesso.\n\nSeguem em anexo ${anexosTxt}.${cobrancaLinha}\n\nFicamos à disposição para qualquer dúvida.`
    );
  }, [clienteNome, anoBase, cobrancaValor, arquivoDarfUrl]);

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
        .from('escritorios')
        .select('nome')
        .eq('id', profile.escritorioId)
        .single();
      if (data?.nome) setNomeEscritorio(data.nome);
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

      // Registrar que a declaração foi enviada
      await supabase
        .from('declaracoes')
        .update({ declaracao_enviada_em: new Date().toISOString() })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Enviar Declaração por E-mail
          </DialogTitle>
          <DialogDescription>
            O e-mail será enviado para <strong>{clienteEmail}</strong> com links seguros dos documentos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem do e-mail</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite a mensagem que será enviada no corpo do e-mail..."
              className="min-h-[150px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emails-copia">Enviar cópia para (opcional)</Label>
            <Input
              id="emails-copia"
              type="text"
              value={emailsCopia}
              onChange={(e) => setEmailsCopia(e.target.value)}
              placeholder="email1@exemplo.com, email2@exemplo.com"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Separe múltiplos e-mails por vírgula (máx. {MAX_CC}).
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase font-semibold">Documentos inclusos:</Label>
            <div className="space-y-2">
              {arquivoDeclaracaoUrl && (
                <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded border border-dashed">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="truncate flex-1">{arquivoDeclaracaoNome || 'Declaração.pdf'}</span>
                </div>
              )}
              {arquivoReciboUrl && (
                <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded border border-dashed">
                  <Receipt className="h-4 w-4 text-primary" />
                  <span className="truncate flex-1">{arquivoReciboNome || 'Recibo.pdf'}</span>
                </div>
              )}
              {arquivoDarfUrl && (
                <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded border border-dashed">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="truncate flex-1">{arquivoDarfNome || 'DARF.pdf'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleEnviar} disabled={loading}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
