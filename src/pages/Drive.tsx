import { useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, FileText, Search, Download, ChevronRight, Image as ImageIcon, File, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCPF } from '@/lib/formatters';
import { toast } from 'sonner';
import { FileViewerModal, type ViewerFile } from '@/components/drive/FileViewerModal';
import { getErrorMessage } from '@/lib/errors';

interface DocWithDeclaracao {
  id: string;
  arquivo_nome: string | null;
  arquivo_url: string | null;
  nome_documento: string;
  categoria: string;
  status: string;
  lancado: boolean | null;
  declaracoes: {
    ano_base: number;
    cliente_id: string;
    clientes: { id: string; nome: string; cpf: string } | null;
  } | null;
}

export default function Drive() {
  const { profile } = useAuth();
  const escritorioId = profile.escritorioId;
  const [busca, setBusca] = useState('');
  const [anoFiltro, setAnoFiltro] = useState(String(new Date().getFullYear()));
  const [expandedCliente, setExpandedCliente] = useState<string | null>(null);
  const [expandedCategoria, setExpandedCategoria] = useState<string | null>(null);
  const [viewerState, setViewerState] = useState<{ files: ViewerFile[]; currentId: string | null }>({ files: [], currentId: null });

  const queryClient = useQueryClient();
  const [togglingLancadoId, setTogglingLancadoId] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['drive-docs', escritorioId, anoFiltro],
    queryFn: async () => {
      if (!escritorioId) return [];
      const { data } = await supabase
        .from('checklist_documentos')
        .select('id, arquivo_nome, arquivo_url, nome_documento, categoria, status, lancado, created_at, declaracoes!inner(ano_base, cliente_id, clientes(id, nome, cpf))')
        .eq('declaracoes.escritorio_id', escritorioId)
        .eq('declaracoes.ano_base', Number(anoFiltro))
        .not('arquivo_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500);
      return (data || []).filter((d: { arquivo_url: string | null }) => !d.arquivo_url?.includes('/_analise_caixa/'));
    },
    enabled: !!escritorioId,
  });

  const toggleLancado = useMutation({
    mutationFn: async ({ id, novoValor }: { id: string; novoValor: boolean }) => {
      setTogglingLancadoId(id);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('checklist_documentos')
        .update({
          lancado: novoValor,
          lancado_em: novoValor ? new Date().toISOString() : null,
          lancado_por: novoValor ? userData.user?.id ?? null : null,
        })
        .eq('id', id);
      if (error) throw error;
      return { id, novoValor };
    },
    onSuccess: (res) => {
      toast.success(res.novoValor ? 'Documento marcado como lançado' : 'Marcação removida');
      // Atualiza o file aberto no modal (e a lista do Drive) sem aguardar refetch
      setViewerState((s) => ({
        ...s,
        files: s.files.map((f) => (f.id === res.id ? { ...f, lancado: res.novoValor } : f)),
      }));
      queryClient.invalidateQueries({ queryKey: ['drive-docs'] });
      queryClient.invalidateQueries({ queryKey: ['documentos-declaracao'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-aba-docs'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao-checklist'] });
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Falha ao atualizar status')),
    onSettled: () => setTogglingLancadoId(null),
  });

  const tree = useMemo(() => {
    const clienteMap = new Map<string, { id: string; nome: string; cpf: string; cliente: DocWithDeclaracao[]; contador: DocWithDeclaracao[] }>();
    for (const doc of docs as DocWithDeclaracao[]) {
      const cl = doc.declaracoes?.clientes;
      if (!cl) continue;
      if (busca) {
        const termo = busca.trim().toLowerCase();
        const digitos = busca.replace(/\D/g, '');
        const matchNome = termo ? cl.nome?.toLowerCase().includes(termo) : false;
        const matchCpf = digitos ? cl.cpf?.replace(/\D/g, '').includes(digitos) : false;
        if (!matchNome && !matchCpf) continue;
      }
      if (!clienteMap.has(cl.id)) {
        clienteMap.set(cl.id, { id: cl.id, nome: cl.nome, cpf: cl.cpf, cliente: [], contador: [] });
      }
      const c = clienteMap.get(cl.id)!;
      if (doc.categoria === 'contador') c.contador.push(doc);
      else c.cliente.push(doc);
    }
    return Array.from(clienteMap.values()).map(c => ({
      ...c,
      pastas: [
        { key: 'cliente', label: 'Enviados pelo cliente', docs: c.cliente },
        { key: 'contador', label: 'Enviados pelo contador', docs: c.contador },
      ].filter(p => p.docs.length > 0),
    }));
  }, [docs, busca]);

  const totalDocs = docs.length;

  const getFileIcon = (name: string | null) => {
    if (!name) return File;
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext || '')) return ImageIcon;
    if (ext === 'pdf') return FileText;
    return File;
  };

  const handleDownload = useCallback(async (arquivoUrl: string) => {
    try {
      const { data, error } = await supabase.storage.from('documentos-clientes').createSignedUrl(arquivoUrl, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch {
      toast.error('Erro ao baixar arquivo');
    }
  }, []);

  const openViewer = useCallback((docs: DocWithDeclaracao[], docId: string) => {
    const files: ViewerFile[] = docs
      .filter(d => d.arquivo_url && d.arquivo_nome)
      .map(d => ({ id: d.id, arquivo_url: d.arquivo_url!, arquivo_nome: d.arquivo_nome!, lancado: !!d.lancado }));
    setViewerState({ files, currentId: docId });
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-sidebar-primary" />
              Drive de Documentos
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{totalDocs} documentos recebidos</p>
          </div>
          <Select value={anoFiltro} onValueChange={setAnoFiltro}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2026, 2025, 2024].map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CPF..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : tree.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhum documento encontrado para {anoFiltro}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tree.map(cliente => (
              <Card key={cliente.id} className="overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                  onClick={() => setExpandedCliente(expandedCliente === cliente.id ? null : cliente.id)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedCliente === cliente.id ? 'rotate-90' : ''}`} />
                    <FolderOpen className="h-5 w-5 text-sidebar-primary" />
                    <span className="font-medium text-foreground">{cliente.nome}</span>
                    <span className="text-xs text-muted-foreground font-mono">{formatCPF(cliente.cpf)}</span>
                  </div>
                  <Badge variant="secondary">{cliente.pastas.reduce((s, c) => s + c.docs.length, 0)} docs</Badge>
                </button>

                {expandedCliente === cliente.id && (
                  <div className="border-t px-4 pb-4">
                    {cliente.pastas.map(pasta => (
                      <div key={pasta.key} className="mt-2">
                        <button
                          className="w-full flex items-center gap-2 py-2 px-2 rounded hover:bg-muted/50 text-sm text-left"
                          onClick={() => setExpandedCategoria(expandedCategoria === `${cliente.id}-${pasta.key}` ? null : `${cliente.id}-${pasta.key}`)}
                        >
                          <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${expandedCategoria === `${cliente.id}-${pasta.key}` ? 'rotate-90' : ''}`} />
                          <FolderOpen className={`h-4 w-4 ${pasta.key === 'contador' ? 'text-sidebar-primary' : 'text-muted-foreground'}`} />
                          <span className="text-foreground">{pasta.label}</span>
                          <Badge variant="outline" className="ml-auto text-xs">{pasta.docs.length}</Badge>
                        </button>
                        {expandedCategoria === `${cliente.id}-${pasta.key}` && (
                          <div className="ml-8 mt-1 space-y-1">
                            {pasta.docs.map(doc => {
                              const Icon = getFileIcon(doc.arquivo_nome);
                              return (
                                <div key={doc.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-muted/30 text-sm group">
                                  <button
                                    type="button"
                                    onClick={() => doc.arquivo_url && openViewer(pasta.docs, doc.id)}
                                    disabled={!doc.arquivo_url}
                                    className="flex items-center gap-2 min-w-0 flex-1 text-left hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Icon className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-accent transition-colors" />
                                    <span className="truncate text-foreground group-hover:text-accent transition-colors">
                                      {doc.arquivo_nome || doc.nome_documento}
                                    </span>
                                  </button>
                                  {doc.arquivo_url && (
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => openViewer(pasta.docs, doc.id)}
                                        title="Visualizar"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => handleDownload(doc.arquivo_url!)}
                                        title="Baixar"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <FileViewerModal
        files={viewerState.files}
        currentId={viewerState.currentId}
        onClose={() => setViewerState({ files: [], currentId: null })}
        onChange={(id) => setViewerState(s => ({ ...s, currentId: id }))}
        onToggleLancado={(id, novoValor) => toggleLancado.mutate({ id, novoValor })}
        togglingLancadoId={togglingLancadoId}
      />
    </DashboardLayout>
  );
}
