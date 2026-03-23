import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AVAILABLE_TAGS, replaceTags } from '@/hooks/useMensagens';

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

  const handleSubmit = () => {
    if (!nome || !corpo) return;
    onSave({
      ...(editData ? { id: editData.id } : {}),
      nome, canal, assunto: assunto || null, corpo,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
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
          <div>
            <Label>Tags disponíveis</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {AVAILABLE_TAGS.map((tag) => (
                <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-accent/10 transition-colors" onClick={() => insertTag(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>Corpo da mensagem *</Label>
            <Textarea ref={textareaRef} value={corpo} onChange={(e) => setCorpo(e.target.value)} rows={5} placeholder="Digite a mensagem..." className="font-mono text-sm" maxLength={2000} />
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
