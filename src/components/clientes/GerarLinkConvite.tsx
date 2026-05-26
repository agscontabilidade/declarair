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
import {
  Copy,
  Link2,
  Mail,
  MessageCircle,
  Info,
  Save,
  User,
  IdCard,
  CheckCircle2,
  Loader2,
  Sparkles,
  Send,
} from 'lucide-react';
import { maskCPF, validateCPF } from '@/lib/formatters';
import { getErrorMessage } from '@/lib/errors';
import { PORTAL_BASE_URL } from '@/lib/constants';

interface GerarLinkConviteProps {
  disabled?: boolean;
  disabledReason?: string;
}

export default function GerarLinkConvite({ disabled = false, disabledReason }: GerarLinkConviteProps) {
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
        await supabase.from('templates_mensagem').insert({
          escritorio_id: profile.escritorioId,
          nome: 'Convite Cliente',
          canal: 'whatsapp',
          corpo: mensagemTemplate,
          ativo: true,
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
      await salvarTemplate();

      const token = crypto.randomUUID() + '-' + Date.now().toString(36);
      const cleanCPF = formData.cpf_sugerido ? formData.cpf_sugerido.replace(/\D/g, '') : null;

      const { error } = await supabase.from('convites_cliente').insert({
        escritorio_id: profile.escritorioId,
        token,
        created_by: user?.id,
        nome_sugerido: formData.nome_sugerido || null,
        cpf_sugerido: cleanCPF,
        email_sugerido: formData.email_sugerido || null,
        mensagem_personalizada: mensagemTemplate || null,
      });

      if (error) throw error;

      const linkCompleto = `${PORTAL_BASE_URL}/cadastro-cliente/${token}`;
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
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-xl">
                {linkGerado ? 'Link de convite pronto' : 'Gerar link de convite'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {linkGerado
                  ? 'Copie ou compartilhe diretamente com o contribuinte.'
                  : 'Crie um link único para o contribuinte se autocadastrar no portal.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!linkGerado ? (
          <div className="px-6 py-5 space-y-6">
            {/* Seção: Dados sugeridos */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold tracking-tight">Dados sugeridos (opcional)</h3>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Pré-preenche os campos no cadastro do contribuinte.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={formData.nome_sugerido}
                      onChange={(e) => setFormData({ ...formData, nome_sugerido: e.target.value })}
                      placeholder="João da Silva"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">CPF</Label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={maskCPF(formData.cpf_sugerido)}
                      onChange={(e) => setFormData({ ...formData, cpf_sugerido: e.target.value })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.email_sugerido}
                    onChange={(e) => setFormData({ ...formData, email_sugerido: e.target.value })}
                    placeholder="cliente@email.com"
                    className="pl-9"
                  />
                </div>
              </div>
            </section>

            {/* Seção: Mensagem */}
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold tracking-tight">Mensagem de convite</h3>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground font-mono">
                    {'{nome}'}
                  </span>
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground font-mono">
                    {'{link}'}
                  </span>
                </div>
              </div>

              <Textarea
                value={mensagemTemplate}
                onChange={(e) => setMensagemTemplate(e.target.value)}
                placeholder="Escreva a mensagem de convite..."
                rows={6}
                className="text-sm resize-none"
              />

              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="h-3 w-3" />
                  Use {'{nome}'} e {'{link}'} como variáveis.
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={salvarTemplate}
                  disabled={savingTemplate}
                  className="h-7 text-[11px] gap-1.5"
                >
                  {savingTemplate ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  Salvar como padrão
                </Button>
              </div>
            </section>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Sucesso */}
            <div className="p-4 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-sm font-semibold">Link gerado com sucesso</p>
                </div>
                <Button size="sm" variant="ghost" onClick={copiarLink} className="h-7 gap-1.5 text-xs">
                  <Copy className="h-3 w-3" />
                  Copiar
                </Button>
              </div>
              <Input value={linkGerado} readOnly className="font-mono text-xs bg-background" />
            </div>

            {/* Prévia */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold tracking-tight">Prévia da mensagem</h3>
              </div>
              <div className="p-3 bg-muted/60 rounded-md text-xs whitespace-pre-wrap border italic text-muted-foreground max-h-48 overflow-y-auto">
                {getMensagemFinal()}
              </div>
              <Button size="sm" variant="outline" onClick={copiarMensagem} className="w-full h-8 gap-1.5">
                <Copy className="h-3 w-3" />
                Copiar mensagem completa
              </Button>
            </section>

            {/* Compartilhar */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold tracking-tight">Compartilhar com o contribuinte</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={compartilharWhatsApp} className="w-full gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={compartilharEmail} className="w-full gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </div>
            </section>

            <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t pt-3">
              <p>• Link permanente — não expira</p>
              <p>• Pode ser usado por múltiplos contribuintes (reutilizável)</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-2">
          {!linkGerado ? (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleGerar} disabled={loading} className="gap-2 min-w-[180px]">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" />
                    Gerar link
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={resetForm}>
                Gerar novo link
              </Button>
              <Button onClick={() => setOpen(false)} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Concluir
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
