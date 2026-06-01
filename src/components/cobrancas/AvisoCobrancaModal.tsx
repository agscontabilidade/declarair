import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, MessageCircle, Lock, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAddons } from '@/hooks/useAddons';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { CobrancaComCliente } from '@/types/domain';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cobrancas: CobrancaComCliente[];
  modo: 'individual' | 'massa';
}

export function AvisoCobrancaModal({ open, onOpenChange, cobrancas, modo }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { myAddons, catalog } = useAddons();
  const { profile } = useAuth();
  const escritorioId = profile?.escritorioId;

  const [canal, setCanal] = useState<'email' | 'whatsapp'>('email');
  const [mensagem, setMensagem] = useState<string>('');
  const [ccEmails, setCcEmails] = useState<string>('');
  const [enviando, setEnviando] = useState(false);
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set());

  const whatsappAddon = catalog.find((a) => a.nome.toLowerCase().includes('whatsapp'));
  const whatsappAtivo = whatsappAddon
    ? myAddons.some((a) => a.addon_id === whatsappAddon.id && a.status === 'ativo')
    : false;

  const { data: escritorio } = useQuery({
    queryKey: ['escritorio-aviso-cobranca', escritorioId],
    enabled: !!escritorioId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escritorios')
        .select('nome, nome_fantasia, chave_pix')
        .eq('id', escritorioId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const chavePix = escritorio?.chave_pix?.trim() || '';
  const nomeEscritorio = escritorio?.nome_fantasia?.trim() || escritorio?.nome?.trim() || '';

  const elegiveisRaw = useMemo(
    () => cobrancas.filter((c) => c.status === 'pendente' || c.status === 'atrasado'),
    [cobrancas],
  );

  const mensagemPadrao = useMemo(() => {
    const blocoPix = chavePix
      ? `\n\nCaso ainda não tenha pago, segue nossa chave Pix:\n🔑 *${chavePix}*`
      : '';
    if (modo === 'individual' && elegiveisRaw.length === 1) {
      const c = elegiveisRaw[0];
      const nome = c.clientes?.nome?.split(' ')[0] || 'tudo bem';
      const valor = formatCurrency(Number(c.valor));
      const descricao = c.descricao || 'honorários contábeis';
      const venc = formatDate(c.data_vencimento);
      return (
        `Olá ${nome}, tudo bem?\n\n` +
        `Passando para lembrar que o honorário no valor de *${valor}* referente a ${descricao} está em aberto (vencimento *${venc}*).\n\n` +
        `Se você já realizou o pagamento, por favor desconsidere este aviso. 🙂` +
        blocoPix +
        `\n\nQualquer dúvida, estamos à disposição.`
      );
    }
    return (
      `Olá {nome}, tudo bem?\n\n` +
      `Passando para lembrar que o honorário no valor de *R$ {valor}* referente a {descricao} está em aberto (vencimento *{vencimento}*).\n\n` +
      `Se você já realizou o pagamento, por favor desconsidere este aviso. 🙂` +
      (chavePix
        ? `\n\nCaso ainda não tenha pago, segue nossa chave Pix:\n🔑 *{chave_pix}*`
        : '') +
      `\n\nQualquer dúvida, estamos à disposição.`
    );
  }, [modo, elegiveisRaw, chavePix]);

  // Chave que identifica o alvo atual (muda quando cliente/cobrança muda)
  const alvoKey = useMemo(() => elegiveisRaw.map((c) => c.id).join(','), [elegiveisRaw]);

  // Reseta canal/exclusões/mensagem/cc ao abrir OU quando alvo muda
  // Evita reaproveitar texto do cliente anterior
  useEffect(() => {
    if (open) {
      setCanal('email');
      setExcluidos(new Set());
      setMensagem('');
      setCcEmails('');
    }
  }, [open, alvoKey]);

  // Pré-popula a mensagem quando o template padrão estiver pronto (somente se vazia)
  useEffect(() => {
    if (open && !mensagem.trim() && mensagemPadrao) {
      setMensagem(mensagemPadrao);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mensagemPadrao]);

  const elegiveis = elegiveisRaw;
  const alvo = useMemo(() => elegiveis.filter((c) => !excluidos.has(c.id)), [elegiveis, excluidos]);

  const semCanal = useMemo(() => {
    if (canal === 'email') return alvo.filter((c) => !c.clientes?.email).length;
    return alvo.filter((c) => !c.clientes?.telefone).length;
  }, [alvo, canal]);

  const validos = alvo.length - semCanal;

  const toggle = (id: string) => {
    setExcluidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEnviar = async () => {
    if (alvo.length === 0) {
      toast({ title: 'Nenhuma cobrança selecionada', variant: 'destructive' });
      return;
    }

    // Parse and validate CC emails (only for email channel)
    const ccList: string[] = [];
    if (canal === 'email' && ccEmails.trim()) {
      const parts = ccEmails.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = parts.filter((e) => !emailRegex.test(e));
      if (invalid.length > 0) {
        toast({ title: 'Emails de cópia inválidos', description: invalid.join(', '), variant: 'destructive' });
        return;
      }
      ccList.push(...parts.slice(0, 10));
    }

    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('enviar-aviso-cobranca', {
        body: {
          canal,
          mensagem,
          cobrancaIds: alvo.map((c) => c.id),
          ...(canal === 'email' && ccList.length > 0 ? { cc: ccList } : {}),
        },
      });
      if (error) throw error;
      const enfileirados = (data as { enfileirados?: number })?.enfileirados ?? 0;
      const pulados = (data as { pulados?: unknown[] })?.pulados ?? [];
      toast({
        title: canal === 'email' ? 'Avisos enfileirados' : 'Avisos enviados',
        description: `${enfileirados} enviado(s)${pulados.length ? `, ${pulados.length} pulado(s)` : ''}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado';
      toast({ title: 'Falha ao enviar', description: msg, variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Avisar sobre cobrança{modo === 'massa' ? 's' : ''}</DialogTitle>
          <DialogDescription>
            {modo === 'individual'
              ? 'Enviar aviso individual ao cliente desta cobrança.'
              : `${elegiveis.length} cobrança(s) pendente(s)/atrasada(s) selecionada(s). Disparo em fila para não sobrecarregar.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
          <div>
            <Label className="mb-2 block">Canal</Label>
            <RadioGroup value={canal} onValueChange={(v) => setCanal(v as 'email' | 'whatsapp')} className="flex gap-3">
              <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-border p-3 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value="email" />
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email</span>
              </label>
              <label className={`flex flex-1 cursor-pointer items-center gap-2 rounded-md border border-border p-3 ${whatsappAtivo ? 'hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5' : 'opacity-70'}`}>
                <RadioGroupItem value="whatsapp" disabled={!whatsappAtivo} />
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm font-medium">WhatsApp</span>
                {!whatsappAtivo && <Lock className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
              </label>
            </RadioGroup>
            {!whatsappAtivo && canal === 'whatsapp' && (
              <Alert className="mt-2">
                <AlertDescription className="flex items-center justify-between gap-2 text-sm">
                  <span>Addon WhatsApp não está ativo no seu plano.</span>
                  <Button size="sm" variant="outline" onClick={() => navigate('/addons')}>Ativar</Button>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div>
            <Label htmlFor="mensagem">Mensagem personalizada (opcional)</Label>
            <Textarea
              id="mensagem"
              rows={4}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              maxLength={2000}
              placeholder="Ex: Por favor, regularize até sexta-feira para evitar juros."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {modo === 'massa'
                ? <>Use <code className="font-mono">{'{nome}'}</code>, <code className="font-mono">{'{valor}'}</code>, <code className="font-mono">{'{descricao}'}</code>, <code className="font-mono">{'{vencimento}'}</code>, <code className="font-mono">{'{chave_pix}'}</code> — serão substituídos por destinatário.</>
                : <>Substitui <code className="font-mono">{'{mensagem_adicional}'}</code> no template do escritório.</>}
            </p>
            {!chavePix && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                Nenhuma chave Pix cadastrada. Cadastre em Configurações para incluí-la automaticamente.
              </p>
            )}
          </div>

          {modo === 'massa' && elegiveis.length > 0 && (
            <div>
              <Label className="mb-2 block">Cobranças a serem avisadas</Label>
              <div className="rounded-md border border-border divide-y max-h-64 overflow-y-auto">
                {elegiveis.map((c) => {
                  const incluida = !excluidos.has(c.id);
                  const semContato = canal === 'email' ? !c.clientes?.email : !c.clientes?.telefone;
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-3 p-2.5 text-sm cursor-pointer hover:bg-muted/30 ${semContato ? 'opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={incluida}
                        onChange={() => toggle(c.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.clientes?.nome || '—'}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {c.descricao} · venc. {formatDate(c.data_vencimento)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="tabular-nums">{formatCurrency(Number(c.valor))}</div>
                        {semContato && (
                          <div className="text-[10px] text-destructive">sem {canal === 'email' ? 'email' : 'telefone'}</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {semCanal > 0 && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                {semCanal} cobrança(s) sem {canal === 'email' ? 'email' : 'telefone'} cadastrado serão puladas.
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <strong>{validos}</strong> de <strong>{alvo.length}</strong> {canal === 'email' ? 'email(s) serão enfileirados' : 'mensagem(ns) WhatsApp serão enviadas'}.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>Cancelar</Button>
          <Button
            onClick={handleEnviar}
            disabled={enviando || validos === 0 || (canal === 'whatsapp' && !whatsappAtivo)}
          >
            {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar aviso{alvo.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
