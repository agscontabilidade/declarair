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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

        <TooltipProvider delayDuration={150}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Total — informativo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1.5 cursor-help h-8 px-2.5">
                  <Filter className="h-3.5 w-3.5" />
                  <span className="font-medium">{stats.total}</span>
                  <span className="text-muted-foreground">Total</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Declarações exibidas com os filtros atuais.</TooltipContent>
            </Tooltip>

            {/* Paradas +7d — chip toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onUrgenciaChange(filters.urgencia === 'urgente' ? 'todas' : 'urgente')}
                  disabled={stats.urgentes === 0}
                  className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    filters.urgencia === 'urgente'
                      ? 'bg-destructive text-destructive-foreground border-destructive ring-2 ring-destructive/30'
                      : 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20'
                  }`}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="tabular-nums">{stats.urgentes}</span>
                  <span>Paradas +7d</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {stats.urgentes === 0
                  ? 'Nenhuma declaração parada há mais de 7 dias.'
                  : `${stats.urgentes} ${stats.urgentes === 1 ? 'declaração sem mudança' : 'declarações sem mudança'} de status há mais de 7 dias. Clique para filtrar.`}
              </TooltipContent>
            </Tooltip>

            {/* Atenção 3-7d — chip toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onUrgenciaChange(filters.urgencia === 'atencao' ? 'todas' : 'atencao')}
                  disabled={stats.atencao === 0}
                  className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    filters.urgencia === 'atencao'
                      ? 'bg-warning text-warning-foreground border-warning ring-2 ring-warning/30'
                      : 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span className="tabular-nums">{stats.atencao}</span>
                  <span>Atenção 3-7d</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {stats.atencao === 0
                  ? 'Nenhuma declaração parada entre 3 e 7 dias.'
                  : `${stats.atencao} ${stats.atencao === 1 ? 'declaração sem mudança' : 'declarações sem mudança'} de status entre 3 e 7 dias. Clique para filtrar.`}
              </TooltipContent>
            </Tooltip>

            {/* Em dia — chip toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onUrgenciaChange(filters.urgencia === 'normal' ? 'todas' : 'normal')}
                  className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-xs font-medium transition-all ${
                    filters.urgencia === 'normal'
                      ? 'bg-success text-success-foreground border-success ring-2 ring-success/30'
                      : 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                  }`}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Em dia</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Atualizadas nos últimos 3 dias. Clique para filtrar.</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

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
