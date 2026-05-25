import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Copy, Mail, MessageCircle, CheckCircle2, Loader2, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PORTAL_BASE_URL } from '@/lib/constants';
import { getErrorMessage } from '@/lib/errors';

export interface EnviarConviteClienteCtx {
  clienteId: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  mode?: 'novo' | 'reusar';
  tokenExistente?: string | null;
}

interface Props {
  ctx: EnviarConviteClienteCtx | null;
  onClose: () => void;
}

export function EnviarConviteClienteDialog({ ctx, onClose }: Props) {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ctx) {
      setLink('');
      return;
    }
    let cancelled = false;
    (async () => {
      // Reusar token existente sem novo update
      if (ctx.mode === 'reusar' && ctx.tokenExistente) {
        setLink(`${PORTAL_BASE_URL}/cliente/convite/${ctx.tokenExistente}`);
        return;
      }
      setLoading(true);
      try {
        const token = crypto.randomUUID();
        const expira = new Date();
        expira.setDate(expira.getDate() + 7);
        const { error } = await supabase
          .from('clientes')
          .update({
            token_convite: token,
            token_convite_expira_em: expira.toISOString(),
            status_onboarding: 'convite_enviado',
          })
          .eq('id', ctx.clienteId);
        if (error) throw error;
        if (!cancelled) setLink(`${PORTAL_BASE_URL}/cliente/convite/${token}`);
      } catch (err: unknown) {
        toast({ title: 'Erro ao gerar convite', description: getErrorMessage(err), variant: 'destructive' });
        if (!cancelled) onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ctx, onClose]);

  const isReusar = ctx?.mode === 'reusar';
  const titulo = isReusar ? 'Reenviar convite de acesso' : 'Enviar convite de acesso';

  const mensagem = ctx
    ? `Olá ${ctx.nome}! Acesse seu portal para acompanhar sua declaração de IR e enviar documentos: ${link}`
    : '';

  const copiar = () => {
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado!' });
  };

  const abrirWhatsApp = () => {
    const phone = (ctx?.telefone || '').replace(/\D/g, '');
    const full = phone.startsWith('55') ? phone : `55${phone}`;
    const url = phone
      ? `https://wa.me/${full}?text=${encodeURIComponent(mensagem)}`
      : `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  const abrirEmail = () => {
    const assunto = 'Convite — Portal do contribuinte';
    const url = `mailto:${ctx?.email ?? ''}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(mensagem)}`;
    window.location.href = url;
  };

  return (
    <Dialog open={!!ctx} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="font-display text-lg">{titulo}</DialogTitle>
              <DialogDescription className="text-xs">
                {isReusar
                  ? 'Reaproveite o link existente ou compartilhe novamente com o contribuinte.'
                  : 'O contribuinte cria a própria senha pelo link e acessa o portal.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Gerando link...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4" /> {isReusar ? 'Link do convite' : 'Link pronto'}
              </div>
              <Input value={link} readOnly className="font-mono text-xs bg-background" />
              <p className="text-[11px] text-muted-foreground">Válido por 7 dias.</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={copiar} className="gap-2">
                <Copy className="h-4 w-4" /> Copiar
              </Button>
              <Button variant="outline" onClick={abrirWhatsApp} className="gap-2">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
              <Button variant="outline" onClick={abrirEmail} disabled={!ctx?.email} className="gap-2">
                <Mail className="h-4 w-4" /> Email
              </Button>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button onClick={onClose} className="gap-2">
                <CheckCircle2 className="h-4 w-4" /> Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
