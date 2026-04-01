import { useState, useMemo, useCallback } from 'react';

export interface DashboardFilters {
  search: string;
  contadorId: string | null;
  urgencia: 'todas' | 'urgente' | 'atencao' | 'normal';
  status: string | null;
}

export function calcularUrgencia(dataAtualizacao: string): 'urgente' | 'atencao' | 'normal' {
  if (!dataAtualizacao) return 'normal';
  const diff = Date.now() - new Date(dataAtualizacao).getTime();
  const dias = diff / (1000 * 60 * 60 * 24);
  if (dias > 7) return 'urgente';
  if (dias > 3) return 'atencao';
  return 'normal';
}

interface DeclaracaoFiltravel {
  id: string;
  status: string;
  ultima_atualizacao_status: string;
  contador_id: string | null;
  clientes: { nome: string; cpf: string } | null;
  contador: { nome: string } | null;
}

export function useDashboardFilters<T extends DeclaracaoFiltravel>(declaracoes: T[]) {
  const [filters, setFilters] = useState<DashboardFilters>({
    search: '',
    contadorId: null,
    urgencia: 'todas',
    status: null,
  });

  const declaracoesFiltradas = useMemo(() => {
    let resultado = declaracoes;

    if (filters.search) {
      const s = filters.search.toLowerCase().trim();
      const sDigits = s.replace(/\D/g, '');
      resultado = resultado.filter(dec => {
        const nome = dec.clientes?.nome?.toLowerCase() ?? '';
        const cpf = dec.clientes?.cpf?.replace(/\D/g, '') ?? '';
        return nome.includes(s) || (sDigits && cpf.includes(sDigits));
      });
    }

    if (filters.contadorId) {
      resultado = resultado.filter(dec => dec.contador_id === filters.contadorId);
    }

    if (filters.urgencia !== 'todas') {
      resultado = resultado.filter(dec =>
        calcularUrgencia(dec.ultima_atualizacao_status) === filters.urgencia
      );
    }

    if (filters.status) {
      resultado = resultado.filter(dec => dec.status === filters.status);
    }

    return resultado;
  }, [declaracoes, filters]);

  const stats = useMemo(() => {
    let urgentes = 0;
    let atencao = 0;
    for (const dec of declaracoesFiltradas) {
      const u = calcularUrgencia(dec.ultima_atualizacao_status);
      if (u === 'urgente') urgentes++;
      else if (u === 'atencao') atencao++;
    }
    return { total: declaracoesFiltradas.length, urgentes, atencao };
  }, [declaracoesFiltradas]);

  const setSearch = useCallback((search: string) => setFilters(p => ({ ...p, search })), []);
  const setContadorId = useCallback((contadorId: string | null) => setFilters(p => ({ ...p, contadorId })), []);
  const setUrgencia = useCallback((urgencia: DashboardFilters['urgencia']) => setFilters(p => ({ ...p, urgencia })), []);
  const setStatus = useCallback((status: string | null) => setFilters(p => ({ ...p, status })), []);
  const clearFilters = useCallback(() => setFilters({ search: '', contadorId: null, urgencia: 'todas', status: null }), []);

  const hasActiveFilters = !!(filters.search || filters.contadorId || filters.urgencia !== 'todas' || filters.status);

  return {
    filters,
    setSearch,
    setContadorId,
    setUrgencia,
    setStatus,
    clearFilters,
    declaracoesFiltradas,
    stats,
    hasActiveFilters,
  };
}
