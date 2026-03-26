import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Copy, Link2, Mail, MessageCircle } from 'lucide-react';

export default function GerarLinkConvite() {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkGerado, setLinkGerado] = useState('');

  const [formData, setFormData] = useState({
    nome_sugerido: '',
    cpf_sugerido: '',
    email_sugerido: '',
    mensagem_personalizada: '',
  });

  const handleGerar = async () => {
    if (!profile?.escritorio_id) return;
    setLoading(true);
    try {
      const token = crypto.randomUUID() + '-' + Date.now().toString(36);

      const { error } = await supabase
        .from('convites_cliente' as any)
        .insert({
          escritorio_id: profile.escritorio_id,
          token,
          created_by: profile.id,
          nome_sugerido: formData.nome_sugerido || null,
          cpf_sugerido: formData.cpf_sugerido || null,
          email_sugerido: formData.email_sugerido || null,
          mensagem_personalizada: formData.mensagem_personalizada || null,
        });

      if (error) throw error;

      const baseUrl = window.location.origin;
      const linkCompleto = `${baseUrl}/cadastro-cliente/${token}`;
      setLinkGerado(linkCompleto);
      toast({ title: 'Link gerado com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao gerar link:', error);
      toast({ title: 'Erro ao gerar link', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkGerado);
    toast({ title: 'Link copiado!' });
  };

  const compartilharWhatsApp = () => {
    const mensagem =
      formData.mensagem_personalizada ||
      'Olá! Para iniciar sua declaração de IR, acesse este link:';
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem + '\n\n' + linkGerado)}`;
    window.open(url, '_blank');
  };

  const compartilharEmail = () => {
    const assunto = 'Convite - Declaração de Imposto de Renda';
    const corpo =
      formData.mensagem_personalizada ||
      `Olá,\n\nPara iniciar sua declaração de IR, acesse o link abaixo:\n\n${linkGerado}`;
    const url = `mailto:${formData.email_sugerido}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    window.location.href = url;
  };

  const resetForm = () => {
    setLinkGerado('');
    setFormData({
      nome_sugerido: '',
      cpf_sugerido: '',
      email_sugerido: '',
      mensagem_personalizada: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Link2 className="h-4 w-4" />
          Gerar Link de Convite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerar Link de Convite</DialogTitle>
          <DialogDescription>
            Crie um link único para o cliente se autocadastrar no portal
          </DialogDescription>
        </DialogHeader>

        {!linkGerado ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Cliente (opcional)</Label>
              <Input
                value={formData.nome_sugerido}
                onChange={(e) => setFormData({ ...formData, nome_sugerido: e.target.value })}
                placeholder="João da Silva"
              />
              <p className="text-xs text-muted-foreground">Será pré-preenchido no cadastro</p>
            </div>

            <div className="space-y-2">
              <Label>CPF (opcional)</Label>
              <Input
                value={formData.cpf_sugerido}
                onChange={(e) => setFormData({ ...formData, cpf_sugerido: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label>Email (opcional)</Label>
              <Input
                type="email"
                value={formData.email_sugerido}
                onChange={(e) => setFormData({ ...formData, email_sugerido: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Mensagem Personalizada (opcional)</Label>
              <Textarea
                value={formData.mensagem_personalizada}
                onChange={(e) => setFormData({ ...formData, mensagem_personalizada: e.target.value })}
                placeholder="Olá! Estou enviando este link para você iniciar sua declaração de IR..."
                rows={3}
              />
            </div>

            <Button onClick={handleGerar} disabled={loading} className="w-full">
              {loading ? 'Gerando...' : 'Gerar Link'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <p className="text-sm font-semibold text-accent-foreground mb-2">✅ Link gerado com sucesso!</p>
              <div className="flex gap-2">
                <Input value={linkGerado} readOnly className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={copiarLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Compartilhar via:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={compartilharWhatsApp} className="w-full">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={compartilharEmail} className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                • O link expira em 30 dias<br />
                • Pode ser usado apenas uma vez<br />
                • O cliente se autocadastra usando este link
              </p>
            </div>

            <Button variant="outline" onClick={resetForm} className="w-full">
              Gerar Novo Link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
