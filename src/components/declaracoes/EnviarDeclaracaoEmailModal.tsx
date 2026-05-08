import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  open,
  onOpenChange,
  onSuccess
}: Props) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [nomeEscritorio, setNomeEscritorio] = useState('Seu Contador');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    setMensagem(
      `Prezado(a) ${clienteNome},\n\nSua Declaração de Imposto de Renda ${anoBase} foi transmitida com sucesso.\n\nSeguem em anexo a cópia da declaração e o respectivo recibo de entrega.\n\nFicamos à disposição para qualquer dúvida.`
    );
  }, [clienteNome, anoBase]);

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

      const { data, error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'envio-manual-declaracao',
          recipientEmail: clienteEmail,
          templateData: {
            nomeCliente: clienteNome,
            nomeEscritorio: nomeEscritorio,
            anoBase: String(anoBase),
            mensagemPersonalizada: mensagem
          },
          attachmentPaths
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('E-mail enviado com sucesso para a fila de processamento.');
      
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
