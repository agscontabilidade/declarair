import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Bug, ExternalLink, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const statusOptions = [
  { value: 'aberto', label: 'Aberto', variant: 'destructive' as const },
  { value: 'em_andamento', label: 'Em andamento', variant: 'default' as const },
  { value: 'resolvido', label: 'Resolvido', variant: 'secondary' as const },
  { value: 'fechado', label: 'Fechado', variant: 'outline' as const },
];

const prioridadeMap: Record<string, { label: string; color: string }> = {
  baixa: { label: '🟢 Baixa', color: 'text-green-600' },
  media: { label: '🟡 Média', color: 'text-yellow-600' },
  alta: { label: '🔴 Alta', color: 'text-red-500' },
  critica: { label: '🚨 Crítica', color: 'text-red-700 font-bold' },
};

export default function AdminBugReports() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [resposta, setResposta] = useState('');
  const [novoStatus, setNovoStatus] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'bug-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, resposta_admin }: { id: string; status: string; resposta_admin?: string }) => {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (resposta_admin !== undefined) updateData.resposta_admin = resposta_admin;
      const { error } = await supabase.from('bug_reports').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bug-reports'] });
      toast({ title: 'Bug report atualizado!' });
      setSelectedReport(null);
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    },
  });

  const filtered = (reports ?? []).filter(r => {
    const matchSearch = r.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (r.reportado_por_nome ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.reportado_por_email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'todos' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openDetail = (report: any) => {
    setSelectedReport(report);
    setResposta(report.resposta_admin ?? '');
    setNovoStatus(report.status);
  };

  const handleSave = () => {
    if (!selectedReport) return;
    updateMutation.mutate({
      id: selectedReport.id,
      status: novoStatus,
      resposta_admin: resposta.trim() || undefined,
    });
  };

  const countByStatus = (status: string) => (reports ?? []).filter(r => r.status === status).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Bug Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {countByStatus('aberto')} aberto(s) · {countByStatus('em_andamento')} em andamento
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título, nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {statusOptions.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reportado por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const prio = prioridadeMap[r.prioridade] ?? prioridadeMap.media;
                  const st = statusOptions.find(s => s.value === r.status);
                  const hasScreenshots = Array.isArray(r.screenshots) && (r.screenshots as string[]).length > 0;
                  return (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(r)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {r.titulo}
                          {hasScreenshots && <span className="text-xs text-muted-foreground">📎</span>}
                        </div>
                      </TableCell>
                      <TableCell><span className={prio.color}>{prio.label}</span></TableCell>
                      <TableCell>
                        <Badge variant={st?.variant ?? 'secondary'}>{st?.label ?? r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.reportado_por_nome ?? r.reportado_por_email ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(r.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum bug report encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedReport} onOpenChange={(o) => !o && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{selectedReport.titulo}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Reportado por:</span>
                    <p className="font-medium">{selectedReport.reportado_por_nome ?? '—'}</p>
                    <p className="text-muted-foreground text-xs">{selectedReport.reportado_por_email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Página:</span>
                    <p className="font-medium">{selectedReport.pagina_url ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prioridade:</span>
                    <p className={prioridadeMap[selectedReport.prioridade]?.color}>
                      {prioridadeMap[selectedReport.prioridade]?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data:</span>
                    <p>{format(new Date(selectedReport.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-muted-foreground">Descrição:</span>
                  <p className="mt-1 text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">{selectedReport.descricao}</p>
                </div>

                {Array.isArray(selectedReport.screenshots) && (selectedReport.screenshots as string[]).length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Screenshots:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(selectedReport.screenshots as string[]).map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-32 h-24 rounded-lg overflow-hidden border hover:ring-2 ring-primary transition-all">
                          <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Ações do Admin</span>
                  </div>
                  <Select value={novoStatus} onValueChange={setNovoStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Resposta ou observação do admin..."
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                      Salvar alterações
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
