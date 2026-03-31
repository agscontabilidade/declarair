import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bug, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

export function ReportBugModal() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast({ title: 'Apenas imagens são permitidas', variant: 'destructive' });
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: 'Imagem deve ter no máximo 5MB', variant: 'destructive' });
          continue;
        }
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('bug-screenshots').upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('bug-screenshots').getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
      setScreenshots(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      toast({ title: 'Erro ao fazer upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!titulo.trim() || !descricao.trim()) {
      toast({ title: 'Preencha título e descrição', variant: 'destructive' });
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('bug_reports').insert({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        pagina_url: window.location.pathname,
        prioridade,
        screenshots: screenshots as any,
        reportado_por: user.id,
        reportado_por_nome: profile.nome ?? user.email,
        reportado_por_email: user.email,
        escritorio_id: profile.escritorioId,
      });
      if (error) throw error;
      toast({ title: 'Bug reportado com sucesso!', description: 'Nossa equipe irá analisar.' });
      setOpen(false);
      setTitulo('');
      setDescricao('');
      setPrioridade('media');
      setScreenshots([]);
    } catch (err: any) {
      toast({ title: 'Erro ao enviar report', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          title="Reportar bug"
        >
          <Bug className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            Reportar Bug
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              placeholder="Resumo do problema..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição detalhada *</Label>
            <Textarea
              placeholder="Descreva o que aconteceu, o que esperava e os passos para reproduzir..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">🟢 Baixa</SelectItem>
                <SelectItem value="media">🟡 Média</SelectItem>
                <SelectItem value="alta">🔴 Alta</SelectItem>
                <SelectItem value="critica">🚨 Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Screenshots (opcional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || screenshots.length >= 5}
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Enviando...' : 'Anexar imagem'}
            </Button>
            {screenshots.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {screenshots.map((url, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeScreenshot(i)}
                      className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Máx. 5 imagens, 5MB cada</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Enviar Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
