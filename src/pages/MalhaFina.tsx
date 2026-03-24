import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Shield, Search, RefreshCw, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useMalhaFina } from '@/hooks/useMalhaFina';
import { formatCPF } from '@/lib/formatters';

type ConsultaItem = {
  id: string;
  clientes?: { nome: string } | null;
  cpf: string;
  ano_base: number;
  status_rfb: string;
  ultimo_resultado?: string | null;
  ultima_consulta?: string | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  nao_consultado: { label: 'Não Consultado', color: 'bg-muted text-muted-foreground', icon: Clock },
  em_processamento: { label: 'Em Processamento', color: 'bg-blue-100 text-blue-800', icon: Clock },
  processada: { label: 'Processada', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  em_malha: { label: 'Em Malha', color: 'bg-destructive/10 text-destructive', icon: AlertTriangle },
  com_pendencias: { label: 'Com Pendências', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
  retificada: { label: 'Retificada', color: 'bg-violet-100 text-violet-800', icon: RefreshCw },
};

export default function MalhaFina() {
  const { consultas, isLoading, anoBase, setAnoBase, filtroStatus, setFiltroStatus, consultarIndividual, consultarTodos, consultando } = useMalhaFina();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<any>(null);
  const [busca, setBusca] = useState('');

  const items = (consultas as unknown) as ConsultaItem[];

  const filtered = items.filter(c => {
    if (busca && !c.clientes?.nome?.toLowerCase().includes(busca.toLowerCase()) && !c.cpf.includes(busca.replace(/\D/g, ''))) return false;
    if (filtroStatus && filtroStatus !== 'todos' && c.status_rfb !== filtroStatus) return false;
    return true;
  });

  const emMalha = items.filter(c => c.status_rfb === 'em_malha').length;
  const processadas = items.filter(c => c.status_rfb === 'processada').length;
  const pendentes = items.filter(c => c.status_rfb === 'nao_consultado').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6 text-accent" />
              Monitoramento de Malha Fina
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Acompanhe o status das declarações na Receita Federal</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={String(anoBase)} onValueChange={v => setAnoBase(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2026, 2025, 2024].map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={consultarTodos} disabled={consultando}>
              <RefreshCw className={`h-4 w-4 mr-2 ${consultando ? 'animate-spin' : ''}`} />
              Consultar Todos
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{consultas.length}</p><p className="text-xs text-muted-foreground">Total Transmitidas</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{processadas}</p><p className="text-xs text-muted-foreground">Processadas</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{emMalha}</p><p className="text-xs text-muted-foreground">Em Malha</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-muted-foreground">{pendentes}</p><p className="text-xs text-muted-foreground">Não Consultados</p></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CPF..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Nenhuma declaração transmitida encontrada para {anoBase}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Status RFB</TableHead>
                    <TableHead>Última Consulta</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const cfg = statusConfig[c.status_rfb] || statusConfig.nao_consultado;
                    const Icon = cfg.icon;
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.clientes?.nome || '—'}</TableCell>
                        <TableCell className="font-mono text-sm">{formatCPF(c.cpf)}</TableCell>
                        <TableCell>{c.ano_base}</TableCell>
                        <TableCell>
                          <Badge className={`${cfg.color} gap-1`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.ultima_consulta ? new Date(c.ultima_consulta).toLocaleDateString('pt-BR') : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedConsulta(c); setModalOpen(true); }}>
                            <Search className="h-4 w-4 mr-1" /> Consultar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal Consulta Individual */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Consultar Status na RFB</DialogTitle>
            </DialogHeader>
            {selectedConsulta && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground text-xs">Cliente</Label><p className="font-medium">{selectedConsulta.clientes?.nome}</p></div>
                  <div><Label className="text-muted-foreground text-xs">CPF</Label><p className="font-mono">{formatCPF(selectedConsulta.cpf)}</p></div>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Status Atual</p>
                  <Badge className={(statusConfig[selectedConsulta.status_rfb] || statusConfig.nao_consultado).color}>
                    {(statusConfig[selectedConsulta.status_rfb] || statusConfig.nao_consultado).label}
                  </Badge>
                  {selectedConsulta.ultimo_resultado && (
                    <p className="text-sm mt-2 text-muted-foreground">{selectedConsulta.ultimo_resultado}</p>
                  )}
                </div>
                <Button
                  className="w-full"
                  onClick={() => consultarIndividual(selectedConsulta.id)}
                  disabled={consultando}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${consultando ? 'animate-spin' : ''}`} />
                  Consultar Agora
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  A consulta simulada atualiza o status aleatoriamente para fins de demonstração.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
