import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { 
  Search, 
  Calendar as CalendarIcon, 
  Filter, 
  History, 
  User, 
  Building, 
  Info,
  ArrowUpDown
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', searchTerm, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          escritorios (nome)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    }
  });

  const getActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case 'INSERT':
        return <Badge className="bg-green-500 hover:bg-green-600">Inserção</Badge>;
      case 'UPDATE':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Atualização</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-500 hover:bg-red-600">Exclusão</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              Logs de Auditoria
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Rastreamento de atividades do sistema</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por e-mail, ação ou entidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="INSERT">Inserção</SelectItem>
                  <SelectItem value="UPDATE">Atualização</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[180px]">Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Escritório</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : logs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhum log encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium text-xs">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{log.user_email || 'Sistema'}</span>
                            {log.ip_address && (
                              <span className="text-[10px] text-muted-foreground">IP: {log.ip_address}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <span className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">
                            {log.entity_type || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{log.escritorios?.nome || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                                <Info className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Log</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">ID do Log</p>
                                    <p className="font-mono text-xs">{selectedLog?.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Data/Hora</p>
                                    <p>{selectedLog?.created_at && format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss")}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Entidade ID</p>
                                    <p className="font-mono text-xs">{selectedLog?.entity_id || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Navegador</p>
                                    <p className="text-xs truncate" title={selectedLog?.user_agent}>{selectedLog?.user_agent || '-'}</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-2">Dados (JSON)</p>
                                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[300px] text-xs font-mono">
                                    {JSON.stringify(selectedLog?.details, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
