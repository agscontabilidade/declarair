import { useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, FileText, Search, Download, ChevronRight, Image, File } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCPF } from '@/lib/formatters';
import { toast } from 'sonner';

interface TreeNode {
  ano: number;
  clientes: {
    id: string;
    nome: string;
    cpf: string;
    categorias: {
      categoria: string;
      docs: any[];
    }[];
  }[];
}

export default function Drive() {
  const { profile } = useAuth();
  const escritorioId = profile.escritorioId;
  const [busca, setBusca] = useState('');
  const [anoFiltro, setAnoFiltro] = useState(String(new Date().getFullYear()));
  const [expandedCliente, setExpandedCliente] = useState<string | null>(null);
  const [expandedCategoria, setExpandedCategoria] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['drive-docs', escritorioId, anoFiltro],
    queryFn: async () => {
      if (!escritorioId) return [];
      const { data } = await supabase
        .from('checklist_documentos')
        .select('*, declaracoes!inner(ano_base, cliente_id, clientes(id, nome, cpf))')
        .eq('declaracoes.escritorio_id', escritorioId)
        .eq('declaracoes.ano_base', Number(anoFiltro))
        .not('arquivo_url', 'is', null)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!escritorioId,
  });

  const tree = useMemo(() => {
    const clienteMap = new Map<string, { id: string; nome: string; cpf: string; catMap: Map<string, any[]> }>();
    for (const doc of docs) {
      const cl = (doc as any).declaracoes?.clientes;
      if (!cl) continue;
      if (busca && !cl.nome?.toLowerCase().includes(busca.toLowerCase()) && !cl.cpf?.includes(busca.replace(/\D/g, ''))) continue;
      if (!clienteMap.has(cl.id)) {
        clienteMap.set(cl.id, { id: cl.id, nome: cl.nome, cpf: cl.cpf, catMap: new Map() });
      }
      const c = clienteMap.get(cl.id)!;
      if (!c.catMap.has(doc.categoria)) c.catMap.set(doc.categoria, []);
      c.catMap.get(doc.categoria)!.push(doc);
    }
    return Array.from(clienteMap.values()).map(c => ({
      ...c,
      categorias: Array.from(c.catMap.entries()).map(([cat, d]) => ({ categoria: cat, docs: d })),
    }));
  }, [docs, busca]);

  const totalDocs = docs.length;

  const getFileIcon = (name: string) => {
    if (!name) return File;
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return Image;
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="h-6 w-6 text-accent" />
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
                    <FolderOpen className="h-5 w-5 text-accent" />
                    <span className="font-medium text-foreground">{cliente.nome}</span>
                    <span className="text-xs text-muted-foreground font-mono">{formatCPF(cliente.cpf)}</span>
                  </div>
                  <Badge variant="secondary">{cliente.categorias.reduce((s, c) => s + c.docs.length, 0)} docs</Badge>
                </button>

                {expandedCliente === cliente.id && (
                  <div className="border-t px-4 pb-4">
                    {cliente.categorias.map(cat => (
                      <div key={cat.categoria} className="mt-2">
                        <button
                          className="w-full flex items-center gap-2 py-2 px-2 rounded hover:bg-muted/50 text-sm text-left"
                          onClick={() => setExpandedCategoria(expandedCategoria === `${cliente.id}-${cat.categoria}` ? null : `${cliente.id}-${cat.categoria}`)}
                        >
                          <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${expandedCategoria === `${cliente.id}-${cat.categoria}` ? 'rotate-90' : ''}`} />
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize text-foreground">{cat.categoria}</span>
                          <Badge variant="outline" className="ml-auto text-xs">{cat.docs.length}</Badge>
                        </button>
                        {expandedCategoria === `${cliente.id}-${cat.categoria}` && (
                          <div className="ml-8 mt-1 space-y-1">
                            {cat.docs.map(doc => {
                              const Icon = getFileIcon(doc.arquivo_nome);
                              return (
                                <div key={doc.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30 text-sm">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate text-foreground">{doc.arquivo_nome || doc.nome_documento}</span>
                                  </div>
                                  {doc.arquivo_url && (
                                    <Button variant="ghost" size="sm" className="h-7" onClick={() => handleDownload(doc.arquivo_url)}>
                                      <Download className="h-3 w-3" />
                                    </Button>
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
    </DashboardLayout>
  );
}
