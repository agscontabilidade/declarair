import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, FileText, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCPF, formatDate, STATUS_LABELS } from '@/lib/formatters';

const STATUS_COLORS: Record<string, string> = {
  aguardando_documentos: 'bg-amber-100 text-amber-800',
  documentacao_recebida: 'bg-blue-100 text-blue-800',
  declaracao_pronta: 'bg-emerald-100 text-emerald-800',
  transmitida: 'bg-gray-100 text-gray-700',
};

export default function Declaracoes() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const escritorioId = profile.escritorioId;
  const currentYear = new Date().getFullYear();

  const [anoBase, setAnoBase] = useState(String(currentYear));
  const [statusFilter, setStatusFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: declaracoes = [], isLoading } = useQuery({
    queryKey: ['declaracoes-lista', escritorioId, anoBase],
    queryFn: async () => {
      if (!escritorioId) return [];
      const { data, error } = await supabase
        .from('declaracoes')
        .select('id, status, ano_base, ultima_atualizacao_status, clientes(nome, cpf), usuarios!declaracoes_contador_id_fkey(nome)')
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', Number(anoBase))
        .order('ultima_atualizacao_status', { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        clienteNome: d.clientes?.nome || '—',
        clienteCpf: d.clientes?.cpf || '',
        contadorNome: d.usuarios?.nome || '—',
      }));
    },
    enabled: !!escritorioId,
  });

  const filtered = declaracoes.filter((d: any) => {
    if (statusFilter !== 'todos' && d.status !== statusFilter) return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      const cpfDigits = d.clienteCpf.replace(/\D/g, '');
      if (!d.clienteNome.toLowerCase().includes(s) && !cpfDigits.includes(s.replace(/\D/g, ''))) return false;
    }
    return true;
  });

  function maskCpf(cpf: string) {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length < 11) return formatCPF(cpf);
    return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Declarações</h1>

        <div className="flex flex-wrap gap-3">
          <Select value={anoBase} onValueChange={setAnoBase}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025].map(y => (
                <SelectItem key={y} value={String(y)}>Ano {y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="aguardando_documentos">Aguardando Documentos</SelectItem>
              <SelectItem value="documentacao_recebida">Documentação Recebida</SelectItem>
              <SelectItem value="declaracao_pronta">Declaração Pronta</SelectItem>
              <SelectItem value="transmitida">Transmitida</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou CPF..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground font-medium">Nenhuma declaração encontrada</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Crie declarações pelo Dashboard ou perfil do cliente</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead className="hidden md:table-cell">Contador</TableHead>
                    <TableHead>Ano Base</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.clienteNome}</TableCell>
                      <TableCell className="tabular-nums">{maskCpf(d.clienteCpf)}</TableCell>
                      <TableCell className="hidden md:table-cell">{d.contadorNome}</TableCell>
                      <TableCell>{d.ano_base}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[d.status] || ''}>{STATUS_LABELS[d.status] || d.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(d.ultima_atualizacao_status)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/declaracoes/${d.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
