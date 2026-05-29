import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, MessageCircle, Lock, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { ClientePendente } from '@/hooks/useLembretesPendentes';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientes: ClientePendente[];
  whatsappAtivo: boolean;
  canalInicial?: 'email' | 'whatsapp';
  clienteUnicoId?: string | null;
}

const MENSAGEM_PADRAO = 'Por favor, envie os documentos pendentes assim que possível. Em caso de dúvidas, estamos à disposição.';

export function LembreteEnvioModal({ open, onOpenChange, clientes, whatsappAtivo, canalInicial = 'email', clienteUnicoId = null }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [canal, setCanal] = useState<'email' | 'whatsapp'>(canalInicial);
  const [prazoFinal, setPrazoFinal] = useState<string>('');
  const [mensagem, setMensagem] = useState<string>(MENSAGEM_PADRAO);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setCanal(canalInicial);
      setMensagem(MENSAGEM_PADRAO);
      // sugere data padrão: prazo oficial IRPF (30/05 do ano corrente)
      const ano = new Date().getFullYear();
      setPrazoFinal(`${ano}-05-29`);
    }
  }, [open, canalInicial]);

  const alvo = useMemo(() => {
    if (clienteUnicoId) return clientes.filter((c) => c.id === clienteUnicoId);
    return clientes;
  }, [clientes, clienteUnicoId]);

  const semCanal = useMemo(() => {
    if (canal === 'email') return alvo.filter((c) => !c.email).length;
    return alvo.filter((c) => !c.telefone).length;
  }, [alvo, canal]);

  const validos = alvo.length - semCanal;

  const handleEnviar = async () => {
    if (!prazoFinal) {
      toast({ title: 'Informe o prazo final', variant: 'destructive' });
      return;
    }
    if (alvo.length === 0) {
      toast({ title: 'Nenhum cliente selecionado', variant: 'destructive' });
      return;
    }
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('enviar-lembretes-prazo', {
        body: {
          canal,
          prazoFinal,
          mensagem,
          clienteIds: alvo.map((c) => c.id),
        },
      });
      if (error) throw error;
      const enfileirados = (data as { enfileirados?: number })?.enfileirados ?? 0;
      const pulados = (data as { pulados?: unknown[] })?.pulados ?? [];
      toast({
        title: canal === 'email' ? 'Emails enfileirados' : 'WhatsApp enviado',
        description: `${enfileirados} enviado(s)${pulados.length ? `, ${pulados.length} pulado(s)` : ''}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['lembretes-pendentes'] });
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar lembrete de prazo</DialogTitle>
          <DialogDescription>
            {clienteUnicoId
              ? 'Enviar lembrete individual.'
              : `${alvo.length} cliente(s) selecionado(s).`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
            <Label htmlFor="prazo">Prazo final *</Label>
            <Input id="prazo" type="date" value={prazoFinal} onChange={(e) => setPrazoFinal(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="mensagem">Mensagem adicional</Label>
            <Textarea id="mensagem" rows={4} value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={2000} />
            <p className="mt-1 text-xs text-muted-foreground">Exibido junto ao corpo padrão do lembrete.</p>
          </div>

          {semCanal > 0 && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                {semCanal} cliente(s) sem {canal === 'email' ? 'email' : 'telefone'} cadastrado serão pulados.
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <strong>{validos}</strong> {canal === 'email' ? 'email(s) serão enfileirados' : 'mensagem(ns) WhatsApp serão enviadas'}.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>Cancelar</Button>
          <Button
            onClick={handleEnviar}
            disabled={enviando || validos === 0 || (canal === 'whatsapp' && !whatsappAtivo)}
          >
            {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar lembrete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
