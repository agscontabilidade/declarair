import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, Download, Check, Clock, Minus, Plus, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  nome_documento: string;
  categoria: string;
  obrigatorio: boolean;
  status: string;
  arquivo_url: string | null;
  arquivo_nome: string | null;
}

interface Props {
  checklist: ChecklistItem[];
  isLoading: boolean;
  declaracaoId?: string;
  onUpload: (docId: string, file: File) => void;
  uploading: boolean;
  onAddItem?: (input: { nome_documento: string; categoria: string }) => void;
  hasDeclaracao: boolean;
  onCreateDeclaracao?: () => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  recebido: <Check className="h-4 w-4 text-emerald-600" />,
  pendente: <Clock className="h-4 w-4 text-amber-500" />,
  dispensado: <Minus className="h-4 w-4 text-muted-foreground" />,
};

const categorias = ['Rendimentos', 'Deduções', 'Bens', 'Outros'];
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 20 * 1024 * 1024;

export function AbaDocumentos({ checklist, isLoading, onUpload, uploading, onAddItem, hasDeclaracao, onCreateDeclaracao }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDocNome, setNewDocNome] = useState('');
  const [newDocCategoria, setNewDocCategoria] = useState('Outros');

  // Bulk upload state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<{ file: File; docId: string; error?: string }[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  if (!hasDeclaracao) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground mb-4">Crie uma declaração para gerenciar documentos</p>
          {onCreateDeclaracao && (
            <Button onClick={onCreateDeclaracao}>Criar Declaração</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const pendingItems = checklist.filter(i => i.status === 'pendente');
  const obrigatorios = checklist.filter(i => i.obrigatorio);
  const recebidos = obrigatorios.filter(i => i.status === 'recebido').length;
  const progressPercent = obrigatorios.length > 0 ? (recebidos / obrigatorios.length) * 100 : 0;

  const grouped = categorias.reduce((acc, cat) => {
    acc[cat] = checklist.filter(i => i.categoria === cat);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const handleFileSelect = (docId: string) => {
    setUploadingDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocId) return;
    if (file.size > MAX_SIZE) { toast.error('Arquivo deve ter no máximo 20MB'); return; }
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Apenas PDF, JPG, PNG ou WebP'); return; }
    onUpload(uploadingDocId, file);
    e.target.value = '';
  };

  const handleDownload = async (item: ChecklistItem) => {
    if (!item.arquivo_url) return;
    try {
      const { data, error } = await supabase.storage.from('documentos-clientes').createSignedUrl(item.arquivo_url, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch {
      toast.error('Erro ao baixar arquivo');
    }
  };

  const handleAddDoc = () => {
    if (!newDocNome.trim()) return;
    onAddItem?.({ nome_documento: newDocNome.trim(), categoria: newDocCategoria });
    setNewDocNome('');
    setAddModalOpen(false);
  };

  // Bulk upload handlers
  const handleBulkSelect = () => {
    bulkInputRef.current?.click();
  };

  const handleBulkFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const mapped = files.map(file => {
      let error: string | undefined;
      if (file.size > MAX_SIZE) error = 'Arquivo muito grande (max 20MB)';
      if (!ALLOWED_TYPES.includes(file.type)) error = 'Tipo não permitido';

      // Auto-match: find pending checklist item whose name matches file name
      const fileName = file.name.toLowerCase().replace(/\.[^.]+$/, '');
      let matchedDocId = '';
      for (const item of pendingItems) {
        const docName = item.nome_documento.toLowerCase();
        const words = docName.split(/\s+/);
        const matches = words.filter(w => w.length > 3 && fileName.includes(w));
        if (matches.length >= 1) {
          matchedDocId = item.id;
          break;
        }
      }

      return { file, docId: matchedDocId, error };
    });

    setBulkFiles(mapped);
    setBulkModalOpen(true);
    e.target.value = '';
  };

  const updateBulkDocId = (index: number, docId: string) => {
    setBulkFiles(prev => prev.map((f, i) => i === index ? { ...f, docId } : f));
  };

  const handleBulkUpload = async () => {
    const valid = bulkFiles.filter(f => !f.error && f.docId);
    if (valid.length === 0) { toast.error('Nenhum arquivo válido para enviar'); return; }

    setBulkUploading(true);
    setBulkProgress({ current: 0, total: valid.length });

    let successCount = 0;
    for (let i = 0; i < valid.length; i++) {
      setBulkProgress({ current: i + 1, total: valid.length });
      try {
        onUpload(valid[i].docId, valid[i].file);
        successCount++;
        // Small delay between uploads
        await new Promise(r => setTimeout(r, 500));
      } catch {
        // Continue with next
      }
    }

    setBulkUploading(false);
    setBulkModalOpen(false);
    setBulkFiles([]);
    toast.success(`${successCount} documento(s) enviado(s) com sucesso`);
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
      <input ref={bulkInputRef} type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleBulkFilesChange} />

      {/* Bulk upload button */}
      {pendingItems.length > 0 && (
        <Button variant="outline" onClick={handleBulkSelect} className="w-full gap-2">
          <Upload className="h-4 w-4" /> Enviar Vários Documentos
        </Button>
      )}

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Documentos Recebidos</span>
            <span className="text-sm text-muted-foreground">{recebidos}/{obrigatorios.length}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Grouped checklist */}
      {categorias.map(cat => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        return (
          <Card key={cat}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{cat}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {statusIcons[item.status]}
                    <span className="text-sm">{item.nome_documento}</span>
                    {item.obrigatorio && <Badge variant="outline" className="text-xs">Obrigatório</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'recebido' && item.arquivo_url && (
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(item)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleFileSelect(item.id)} disabled={uploading}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Add doc */}
      <Button variant="outline" onClick={() => setAddModalOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Adicionar Documento
      </Button>

      {/* Add doc modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Documento</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Documento *</Label>
              <Input value={newDocNome} onChange={e => setNewDocNome(e.target.value)} placeholder="Ex: Informe de Rendimentos" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={newDocCategoria} onValueChange={setNewDocCategoria}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddDoc} disabled={!newDocNome.trim()}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk upload modal */}
      <Dialog open={bulkModalOpen} onOpenChange={(v) => { if (!bulkUploading) setBulkModalOpen(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Enviar Vários Documentos</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto py-2">
            {bulkFiles.map((bf, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 border rounded-lg ${bf.error ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{bf.file.name}</p>
                  <p className="text-xs text-muted-foreground">{(bf.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  {bf.error && <p className="text-xs text-destructive">{bf.error}</p>}
                </div>
                {!bf.error && (
                  <Select value={bf.docId} onValueChange={(v) => updateBulkDocId(i, v)}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="Vincular a..." /></SelectTrigger>
                    <SelectContent>
                      {pendingItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.nome_documento}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
          {bulkUploading && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Enviando {bulkProgress.current} de {bulkProgress.total}...</p>
              <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkModalOpen(false)} disabled={bulkUploading}>Cancelar</Button>
            <Button onClick={handleBulkUpload} disabled={bulkUploading || bulkFiles.filter(f => !f.error && f.docId).length === 0}>
              {bulkUploading ? 'Enviando...' : `Enviar ${bulkFiles.filter(f => !f.error && f.docId).length} Documento(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
