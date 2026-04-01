import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, X, Filter, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import type { DashboardFilters as Filters } from '@/hooks/useDashboardFilters';

interface DashboardFiltersProps {
  filters: Filters;
  onSearchChange: (search: string) => void;
  onContadorChange: (contadorId: string | null) => void;
  onUrgenciaChange: (urgencia: Filters['urgencia']) => void;
  onStatusChange: (status: string | null) => void;
  onClear: () => void;
  stats: { total: number; urgentes: number; atencao: number };
  hasActiveFilters: boolean;
}

export function DashboardFilters({
  filters,
  onSearchChange,
  onContadorChange,
  onUrgenciaChange,
  onStatusChange,
  onClear,
  stats,
  hasActiveFilters,
}: DashboardFiltersProps) {
  const { profile } = useAuth();
  const [contadores, setContadores] = useState<Array<{ id: string; nome: string }>>([]);

  useEffect(() => {
    async function load() {
      if (!profile.escritorioId) return;
      const { data } = await supabase
        .from('usuarios')
        .select('id, nome')
        .eq('escritorio_id', profile.escritorioId)
        .eq('ativo', true)
        .order('nome');
      if (data) setContadores(data);
    }
    load();
  }, [profile.escritorioId]);

  return (
    <Card className="p-4 space-y-3">
      {/* Row 1: Search + Stats */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou CPF..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-8"
          />
          {filters.search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Filter className="h-3 w-3" />
            {stats.total}
          </Badge>
          {stats.urgentes > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {stats.urgentes}
            </Badge>
          )}
          {stats.atencao > 0 && (
            <Badge className="gap-1 bg-warning/15 text-warning border-warning/30">
              <Clock className="h-3 w-3" />
              {stats.atencao}
            </Badge>
          )}
        </div>
      </div>

      {/* Row 2: Filter selects */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={filters.contadorId || 'todos'}
          onValueChange={(v) => onContadorChange(v === 'todos' ? null : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os contadores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os contadores</SelectItem>
            {contadores.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.urgencia}
          onValueChange={(v) => onUrgenciaChange(v as Filters['urgencia'])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Urgência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="urgente">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                Urgentes (&gt;7d parado)
              </span>
            </SelectItem>
            <SelectItem value="atencao">
              <span className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-warning" />
                Atenção (&gt;3d parado)
              </span>
            </SelectItem>
            <SelectItem value="normal">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                Normal
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || 'todos'}
          onValueChange={(v) => onStatusChange(v === 'todos' ? null : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="aguardando_documentos">Aguardando Documentação</SelectItem>
            <SelectItem value="documentacao_recebida">Documentação Recebida</SelectItem>
            <SelectItem value="declaracao_pronta">Declaração Pronta</SelectItem>
            <SelectItem value="transmitida">Transmitida</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1.5 text-muted-foreground">
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Busca: "{filters.search}"
              <X className="h-3 w-3 cursor-pointer" onClick={() => onSearchChange('')} />
            </Badge>
          )}
          {filters.contadorId && (
            <Badge variant="secondary" className="gap-1">
              Contador: {contadores.find(c => c.id === filters.contadorId)?.nome ?? '...'}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onContadorChange(null)} />
            </Badge>
          )}
          {filters.urgencia !== 'todas' && (
            <Badge variant="secondary" className="gap-1">
              Urgência: {filters.urgencia}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onUrgenciaChange('todas')} />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status.replace(/_/g, ' ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onStatusChange(null)} />
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
