import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Mail, AlertCircle, CheckCircle2, Clock, Search, Filter, 
  RotateCcw, UserX, Info, ExternalLink 
} from 'lucide-react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminEmails() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('logs');

  const { data: logs, isLoading: loadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['admin-email-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_send_log')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: suppressions, isLoading: loadingSuppressions, refetch: refetchSuppressions } = useQuery({
    queryKey: ['admin-email-suppressions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppressed_emails')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const filteredLogs = logs?.filter(log => 
    log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.template_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppressions = suppressions?.filter(sup => 
    sup.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResend = async (log: any) => {
    toast.info(`Funcionalidade de reenvio para ${log.recipient_email} em desenvolvimento.`);
    // In a real scenario, we might call an edge function like 'process-email-queue' 
    // or insert a new record into a queue table.
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Falha</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Monitoramento de E-mails</h1>
            <p className="text-muted-foreground text-sm mt-1">Acompanhe envios, falhas e supressões</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por e-mail ou nome..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => activeTab === 'logs' ? refetchLogs() : refetchSuppressions()}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Logs de Envios
            </TabsTrigger>
            <TabsTrigger value="suppressions" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Supressões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Erro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingLogs ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/50" />
                        </TableRow>
                      ))
                    ) : filteredLogs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          Nenhum log encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-xs">
                              {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{log.usuario?.nome || 'Visitante'}</span>
                              <span className="text-xs text-muted-foreground">{log.recipient_email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {log.template_name?.replace(/-/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(log.status)}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {log.error_message ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-destructive truncate block cursor-help">
                                      {log.error_message}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-xs">{log.error_message}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleResend(log)}
                              disabled={log.status === 'sent'}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              Reenviar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppressions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">E-mails Suprimidos</CardTitle>
                <CardDescription>
                  E-mails que pararam de receber comunicações por descadastro ou erros permanentes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSuppressions ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={4} className="h-12 animate-pulse bg-muted/50" />
                        </TableRow>
                      ))
                    ) : filteredSuppressions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                          Nenhuma supressão encontrada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSuppressions?.map((sup) => (
                        <TableRow key={sup.id}>
                          <TableCell className="whitespace-nowrap">
                            <span className="text-xs">
                              {format(new Date(sup.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm">{sup.email}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {sup.reason || 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {JSON.stringify(sup.metadata) !== '{}' ? JSON.stringify(sup.metadata) : '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
