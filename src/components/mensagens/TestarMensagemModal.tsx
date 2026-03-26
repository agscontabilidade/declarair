import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { replaceTags } from '@/hooks/useMensagens';
import { useSendWhatsApp, useWhatsAppStatus } from '@/hooks/useWhatsApp';
import { formatCPF, formatCurrency, formatDate, STATUS_LABELS } from '@/lib/formatters';
import { PORTAL_BASE_URL } from '@/lib/constants';
import { toast } from 'sonner';

interface TestarMensagemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: any;
  onEnviar: (clienteId: string, conteudo: string) => void;
}

export function TestarMensagemModal({ open, onOpenChange, template, onEnviar }: TestarMensagemModalProps) {
  const { profile } = useAuth();
  const [clienteId, setClienteId] = useState('');
  const sendWhatsApp = useSendWhatsApp();
  const { data: whatsappStatus } = useWhatsAppStatus();
  const isWhatsAppConnected = whatsappStatus?.status === 'connected';

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-test', profile.escritorioId],
    queryFn: async () => {
      const { data } = await supabase.from('clientes').select('id, nome, cpf, telefone, email').eq('escritorio_id', profile.escritorioId!).order('nome');
      return data || [];
    },
    enabled: open && !!profile.escritorioId,
  });

  const cliente = clientes.find((c: any) => c.id === clienteId);

  const { data: declaracao } = useQuery({
    queryKey: ['declaracao-test', clienteId],
    queryFn: async () => {
      if (!clienteId) return null;
      const { data } = await supabase.from('declaracoes').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!clienteId,
  });

  const { data: escritorio } = useQuery({
    queryKey: ['escritorio-info', profile.escritorioId],
    queryFn: async () => {
      const { data } = await supabase.from('escritorios').select('nome').eq('id', profile.escritorioId!).single();
      return data;
    },
    enabled: !!profile.escritorioId,
  });

  const buildRealData = (): Record<string, string> => {
    if (!cliente) return {};
    return {
      '{nome_cliente}': cliente.nome,
      '{cpf_cliente}': formatCPF(cliente.cpf),
      '{ano_base}': declaracao?.ano_base?.toString() || '—',
      '{status_declaracao}': declaracao ? (STATUS_LABELS[declaracao.status] || declaracao.status) : '—',
      '{tipo_resultado}': declaracao?.tipo_resultado ? (STATUS_LABELS[declaracao.tipo_resultado] || declaracao.tipo_resultado) : '—',
      '{valor_resultado}': declaracao?.valor_resultado ? formatCurrency(Number(declaracao.valor_resultado)) : '—',
      '{data_transmissao}': declaracao?.data_transmissao ? formatDate(declaracao.data_transmissao) : '—',
      '{numero_recibo}': declaracao?.numero_recibo || '—',
      '{nome_contador}': profile.nome || '—',
      '{nome_escritorio}': escritorio?.nome || '—',
      '{link_portal}': `${PORTAL_BASE_URL}/cliente/login`,
      '{link_convite}': `${PORTAL_BASE_URL}/cliente/convite/...`,
      '{valor_cobranca}': '—',
      '{data_vencimento}': '—',
      '{status_cobranca}': '—',
    };
  };

  const previewText = cliente ? replaceTags(template?.corpo || '', buildRealData()) : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(previewText);
    toast.success('Mensagem copiada!');
    if (clienteId && template) {
      onEnviar(clienteId, previewText);
    }
  };

  const handleWhatsApp = () => {
    if (isWhatsAppConnected && cliente?.telefone) {
      // Send via Evolution API
      sendWhatsApp.mutate({
        phone: cliente.telefone,
        message: previewText,
        clienteId,
        templateId: template?.id,
      });
    } else {
      // Fallback: open wa.me link
      const phone = cliente?.telefone?.replace(/\D/g, '') || '';
      const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(previewText)}`, '_blank');
      if (clienteId && template) {
        onEnviar(clienteId, previewText);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Testar Mensagem</DialogTitle>
          <DialogDescription>Selecione um cliente para ver a mensagem com dados reais</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {cliente && (
            <div>
              <Label className="text-muted-foreground">Preview</Label>
              <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">{previewText}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          {cliente && (
            <>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" /> Copiar
              </Button>
              {template?.canal === 'whatsapp' && cliente.telefone && (
                isWhatsAppConnected ? (
                  <Button onClick={handleWhatsApp} disabled={sendWhatsApp.isPending}>
                    <Send className="h-4 w-4 mr-2" />
                    {sendWhatsApp.isPending ? 'Enviando...' : 'Enviar WhatsApp'}
                  </Button>
                ) : (
                  <Button onClick={handleWhatsApp}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Abrir WhatsApp
                  </Button>
                )
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
