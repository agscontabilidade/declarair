import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { AVAILABLE_TAGS, replaceTags } from '@/hooks/useMensagens';

const EXTENDED_TAGS = [
  ...AVAILABLE_TAGS,
  '{valor_cobranca}', '{data_vencimento}', '{status_cobranca}',
];

const TONS_DE_VOZ = [
  { key: 'profissional', label: 'Profissional' },
  { key: 'amigavel', label: 'Amigável' },
  { key: 'direto', label: 'Direto e Objetivo' },
  { key: 'formal', label: 'Formal' },
];

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  loading?: boolean;
  editData?: any;
}

export function TemplateEditor({ open, onOpenChange, onSave, loading, editData }: TemplateEditorProps) {
  const [nome, setNome] = useState('');
  const [canal, setCanal] = useState('whatsapp');
  const [assunto, setAssunto] = useState('');
  const [corpo, setCorpo] = useState('');
  const [tomVoz, setTomVoz] = useState('profissional');
  const [gerando, setGerando] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editData) {
      setNome(editData.nome);
      setCanal(editData.canal);
      setAssunto(editData.assunto || '');
      setCorpo(editData.corpo);
    } else {
      setNome(''); setCanal('whatsapp'); setAssunto(''); setCorpo('');
    }
  }, [editData, open]);

  const insertTag = (tag: string) => {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newValue = corpo.slice(0, start) + tag + corpo.slice(end);
      setCorpo(newValue);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else {
      setCorpo(corpo + tag);
    }
  };

  const handleSugerirIA = async () => {
    if (!nome) return;
    setGerando(true);
    try {
      const tomLabel = TONS_DE_VOZ.find(t => t.key === tomVoz)?.label || 'profissional';
      const prompt = `Gere uma mensagem de ${canal === 'whatsapp' ? 'WhatsApp' : 'email'} para um escritório de contabilidade enviar ao cliente sobre "${nome}". Tom de voz: ${tomLabel}. Use as tags: {nome_cliente}, {nome_escritorio}, {ano_base}. Máximo ${canal === 'whatsapp' ? '800' : '1500'} caracteres. Apenas o corpo da mensagem, sem aspas.`;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/ai-suggest-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) setCorpo(data.suggestion);
      } else {
        // Fallback: generate locally
        const fallbacks: Record<string, string> = {
          profissional: `Prezado(a) {nome_cliente},\n\nInformamos que ${nome.toLowerCase()}.\n\nPara mais detalhes, acesse o portal: {link_portal}\n\nAtenciosamente,\n{nome_escritorio}`,
          amigavel: `Olá {nome_cliente}! 😊\n\n${nome}! Acesse o portal para ver os detalhes: {link_portal}\n\nQualquer dúvida, estamos aqui!\n{nome_escritorio}`,
          direto: `{nome_cliente}, ${nome.toLowerCase()}. Acesse: {link_portal}\n\n{nome_escritorio}`,
          formal: `Caro(a) Sr(a). {nome_cliente},\n\nVimos por meio desta comunicar que ${nome.toLowerCase()}.\n\nPara maiores informações, acessar: {link_portal}\n\nRespeitosamente,\n{nome_escritorio}`,
        };
        setCorpo(fallbacks[tomVoz] || fallbacks.profissional);
      }
    } catch {
      const fallback = `Olá {nome_cliente},\n\n${nome}.\n\nAcesse o portal: {link_portal}\n\n{nome_escritorio}`;
      setCorpo(fallback);
    }
    setGerando(false);
  };

  const handleSubmit = () => {
    if (!nome || !corpo) return;
    onSave({
      ...(editData ? { id: editData.id } : {}),
      nome, canal, assunto: assunto || null, corpo,
    });
  };

  const uniqueTags = [...new Set(EXTENDED_TAGS)];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          <DialogDescription>Configure o template de mensagem</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do template" maxLength={100} />
            </div>
            <div>
              <Label>Canal</Label>
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {canal === 'email' && (
            <div>
              <Label>Assunto</Label>
              <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Assunto do email" maxLength={200} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tom de voz</Label>
              <Select value={tomVoz} onValueChange={setTomVoz}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONS_DE_VOZ.map(t => (
                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={handleSugerirIA} disabled={gerando || !nome}>
                {gerando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Sugerir com IA
              </Button>
            </div>
          </div>

          <div>
            <Label>Tags disponíveis</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {uniqueTags.map((tag) => (
                <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent/10 transition-colors text-xs" onClick={() => insertTag(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Corpo da mensagem *</Label>
            <Textarea ref={textareaRef} value={corpo} onChange={(e) => setCorpo(e.target.value)} rows={6} placeholder="Digite a mensagem..." className="font-mono text-sm" maxLength={2000} />
            <p className="text-xs text-muted-foreground mt-1">{corpo.length} / {canal === 'whatsapp' ? '1000' : '2000'} caracteres</p>
          </div>

          {corpo && (
            <div>
              <Label className="text-muted-foreground">Preview</Label>
              <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">{replaceTags(corpo)}</div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !nome || !corpo}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
