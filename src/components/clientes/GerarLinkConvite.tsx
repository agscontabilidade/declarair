import { useState, useEffect, useCallback } from 'react';
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
import { Copy, Link2, Mail, MessageCircle, Info, Save } from 'lucide-react';
import { maskCPF, validateCPF } from '@/lib/formatters';
import { getErrorMessage } from '@/lib/errors';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function GerarLinkConvite() {
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [linkGerado, setLinkGerado] = useState('');
  const [escritorio, setEscritorio] = useState<{ nome: string } | null>(null);

  const [formData, setFormData] = useState({
    nome_sugerido: '',
    cpf_sugerido: '',
    email_sugerido: '',
  });

  const [mensagemTemplate, setMensagemTemplate] = useState(
    'Olá {nome}!\n\nSou o seu contador. Para iniciar sua declaração de Imposto de Renda, preparamos um portal exclusivo para você.\n\nPor favor, acesse o link abaixo para completar seu cadastro e enviar os documentos necessários:\n\n{link}\n\nQualquer dúvida, estou à disposição!'
  );

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!profile?.escritorioId || !open) return;
      const { data } = await supabase
        .from('templates_mensagem')
        .select('corpo')
        .eq('escritorio_id', profile.escritorioId)
        .eq('nome', 'Convite Cliente')
        .maybeSingle();
      
      if (data?.corpo) {
        setMensagemTemplate(data.corpo);
      }
    };
    fetchTemplate();
  }, [open, profile?.escritorioId]);

  const carregarDadosEscritorio = useCallback(async () => {
    if (!profile?.escritorioId) return;
    const { data } = await supabase
      .from('escritorios')
      .select('nome')
      .eq('id', profile.escritorioId)
      .single();
    if (data) setEscritorio(data);
  }, [profile?.escritorioId]);

  const salvarTemplate = async () => {
    if (!profile?.escritorioId) return;
    setSavingTemplate(true);
    try {
      // Find existing or insert new
      const { data: existing } = await supabase
        .from('templates_mensagem')
        .select('id')
        .eq('escritorio_id', profile.escritorioId)
        .eq('nome', 'Convite Cliente')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('templates_mensagem')
          .update({ corpo: mensagemTemplate })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('templates_mensagem')
          .insert({
            escritorio_id: profile.escritorioId,
            nome: 'Convite Cliente',
            canal: 'whatsapp',
            corpo: mensagemTemplate,
            ativo: true
          });
      }
      toast({ title: 'Template de convite salvo!' });
    } catch (error) {
      toast({ title: 'Erro ao salvar template', variant: 'destructive' });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleGerar = async () => {
    if (!profile?.escritorioId) return;
    if (formData.cpf_sugerido && !validateCPF(formData.cpf_sugerido)) {
      toast({ title: 'CPF inválido', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Also save the template if it was changed
      await salvarTemplate();

      const token = crypto.randomUUID() + '-' + Date.now().toString(36);
      const cleanCPF = formData.cpf_sugerido ? formData.cpf_sugerido.replace(/\D/g, '') : null;

      const { error } = await supabase
        .from('convites_cliente')
        .insert({
          escritorio_id: profile.escritorioId,
          token,
          created_by: user?.id,
          nome_sugerido: formData.nome_sugerido || null,
          cpf_sugerido: cleanCPF,
          email_sugerido: formData.email_sugerido || null,
          mensagem_personalizada: mensagemTemplate || null,
        });

      if (error) throw error;

      const baseUrl = window.location.origin;
      const linkCompleto = `${baseUrl}/cadastro-cliente/${token}`;
      setLinkGerado(linkCompleto);
      toast({ title: 'Link gerado com sucesso!' });
    } catch (error: unknown) {
      console.error('Erro ao gerar link:', error);
      toast({ title: 'Erro ao gerar link', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getMensagemFinal = () => {
    let msg = mensagemTemplate;
    msg = msg.replace('{nome}', formData.nome_sugerido || 'cliente');
    msg = msg.replace('{link}', linkGerado || '[LINK]');
    msg = msg.replace('{escritorio}', escritorio?.nome || 'Escritório Contábil');
    return msg;
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(linkGerado);
    toast({ title: 'Link copiado!' });
  };

  const copiarMensagem = () => {
    navigator.clipboard.writeText(getMensagemFinal());
    toast({ title: 'Mensagem copiada!' });
  };

  const compartilharWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(getMensagemFinal())}`;
    window.open(url, '_blank');
  };

  const compartilharEmail = () => {
    const assunto = 'Convite - Declaração de Imposto de Renda';
    const corpo = getMensagemFinal();
    const url = `mailto:${formData.email_sugerido}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    window.location.href = url;
  };

  const resetForm = () => {
    setLinkGerado('');
    setFormData({
      nome_sugerido: '',
      cpf_sugerido: '',
      email_sugerido: '',
    });
  };

  useEffect(() => {
    if (open) carregarDadosEscritorio();
  }, [open, carregarDadosEscritorio]);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Link2 className="h-4 w-4" />
          Gerar Link de Convite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Link de Convite</DialogTitle>
          <DialogDescription>
            Crie um link único para o cliente se autocadastrar no portal
          </DialogDescription>
        </DialogHeader>

        {!linkGerado ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Cliente (opcional)</Label>
                <Input
                  value={formData.nome_sugerido}
                  onChange={(e) => setFormData({ ...formData, nome_sugerido: e.target.value })}
                  placeholder="João da Silva"
                />
                <p className="text-xs text-muted-foreground">Pré-preenchido no cadastro</p>
              </div>

              <div className="space-y-2">
                <Label>CPF (opcional)</Label>
                <Input
                  value={maskCPF(formData.cpf_sugerido)}
                  onChange={(e) => setFormData({ ...formData, cpf_sugerido: e.target.value })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
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
              <div className="flex justify-between items-center">
                <Label>Mensagem de Convite</Label>
                <div className="flex gap-2">
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{'{nome}'}</span>
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{'{link}'}</span>
                </div>
              </div>
              <Textarea
                value={mensagemTemplate}
                onChange={(e) => setMensagemTemplate(e.target.value)}
                placeholder="Escreva a mensagem de convite..."
                rows={6}
                className="text-sm font-sans"
              />
              <div className="flex justify-between items-center">
                <Alert variant="default" className="py-1 border-none bg-transparent flex-1">
                  <Info className="h-3 w-3" />
                  <AlertDescription className="text-[10px]">
                    Use {'{nome}'} e {'{link}'} como variáveis.
                  </AlertDescription>
                </Alert>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={salvarTemplate} 
                  disabled={savingTemplate}
                  className="h-7 text-[10px] gap-1"
                >
                  <Save className="h-3 w-3" />
                  Salvar como Padrão
                </Button>
              </div>
            </div>

            <Button onClick={handleGerar} disabled={loading} className="w-full">
              {loading ? 'Gerando...' : 'Gerar Link e Persistir Template'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-accent-foreground">✅ Link gerado!</p>
                <Button size="sm" variant="ghost" onClick={copiarLink} className="h-8 gap-1">
                  <Copy className="h-3 w-3" />
                  Copiar Link
                </Button>
              </div>
              <Input value={linkGerado} readOnly className="font-mono text-xs bg-background" />
            </div>

            <div className="space-y-2">
              <Label>Prévia da Mensagem:</Label>
              <div className="p-3 bg-muted rounded-md text-xs whitespace-pre-wrap border italic">
                {getMensagemFinal()}
              </div>
              <Button size="sm" variant="outline" onClick={copiarMensagem} className="w-full h-8 gap-1">
                <Copy className="h-3 w-3" />
                Copiar Mensagem Completa
              </Button>
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
