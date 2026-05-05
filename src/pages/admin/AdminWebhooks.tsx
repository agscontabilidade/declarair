import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Webhook, Activity, Search, Filter, RotateCcw, 
  ExternalLink, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';

export default function AdminWebhooks() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['admin-webhook-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs' as any)
        .select(`
          *,
          webhook:webhooks (
            id,
            url,
            escritorio:escritorios (
              id,
              nome
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    }
  });

  const filteredLogs = logs?.filter((log: any) => 
    log.evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.webhook?.url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.webhook?.escritorio?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> {status}</Badge>;
    }
    if (status === 0) {
      return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
    return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Monitoramento de Webhooks</h1>
            <p className="text-muted-foreground text-sm mt-1">Acompanhe as notificações enviadas para sistemas externos</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por evento, URL ou escritório..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total (100 últimos)</p>
                  <p className="text-2xl font-bold">{logs?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sucesso</p>
                  <p className="text-2xl font-bold">{logs?.filter((l: any) => l.status_code >= 200 && l.status_code < 300).length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Falhas</p>
                  <p className="text-2xl font-bold">{logs?.filter((l: any) => l.status_code > 0 && (l.status_code < 200 || l.status_code >= 300)).length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Escritório</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="h-12 animate-pulse bg-muted/50" />
                    </TableRow>
                  ))
                ) : filteredLogs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Nenhum log encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs?.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {log.evento}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{log.webhook?.escritorio?.nome || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {log.webhook?.url}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status_code)}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.tentativas || 1}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Webhook</DialogTitle>
            <DialogDescription>Payload enviado e resposta recebida</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Payload (JSON)</p>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-48">
                {JSON.stringify(selectedLog?.payload, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Resposta do Servidor</p>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-48">
                {selectedLog?.resposta || 'Sem resposta'}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
