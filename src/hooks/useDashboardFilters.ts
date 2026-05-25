import { useState, useMemo, useCallback } from 'react';

export type OrdenacaoDashboard = 'cadastro_recente' | 'cadastro_antigo' | 'alfabetica_az' | 'alfabetica_za';

export interface DashboardFilters {
  search: string;
  contadorId: string | null;
  urgencia: 'todas' | 'urgente' | 'atencao' | 'normal';
  status: string | null;
  ordenacao: OrdenacaoDashboard;
}

export function calcularUrgencia(dataAtualizacao: string, status?: string): 'urgente' | 'atencao' | 'normal' {
  if (status === 'transmitida') return 'normal';
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
  created_at: string;
  clientes: { nome: string; cpf: string } | null;
  contador: { nome: string } | null;
}

const DEFAULT_ORDENACAO: OrdenacaoDashboard = 'cadastro_recente';

export function useDashboardFilters<T extends DeclaracaoFiltravel>(declaracoes: T[]) {
  const [filters, setFilters] = useState<DashboardFilters>({
    search: '',
    contadorId: null,
    urgencia: 'todas',
    status: null,
    ordenacao: DEFAULT_ORDENACAO,
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
        calcularUrgencia(dec.ultima_atualizacao_status, dec.status) === filters.urgencia
      );
    }


    if (filters.status) {
      resultado = resultado.filter(dec => dec.status === filters.status);
    }

    // Ordenação (não muta o array original)
    const ordenado = [...resultado];
    switch (filters.ordenacao) {
      case 'cadastro_recente':
        ordenado.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
        break;
      case 'cadastro_antigo':
        ordenado.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
        break;
      case 'alfabetica_az':
        ordenado.sort((a, b) =>
          (a.clientes?.nome ?? '').localeCompare(b.clientes?.nome ?? '', 'pt-BR', { sensitivity: 'base' })
        );
        break;
      case 'alfabetica_za':
        ordenado.sort((a, b) =>
          (b.clientes?.nome ?? '').localeCompare(a.clientes?.nome ?? '', 'pt-BR', { sensitivity: 'base' })
        );
        break;
    }

    return ordenado;
  }, [declaracoes, filters]);

  const stats = useMemo(() => {
    let urgentes = 0;
    let atencao = 0;
    for (const dec of declaracoesFiltradas) {
      const u = calcularUrgencia(dec.ultima_atualizacao_status, dec.status);
      if (u === 'urgente') urgentes++;
      else if (u === 'atencao') atencao++;
    }
    return { total: declaracoesFiltradas.length, urgentes, atencao };
  }, [declaracoesFiltradas]);

  const setSearch = useCallback((search: string) => setFilters(p => ({ ...p, search })), []);
  const setContadorId = useCallback((contadorId: string | null) => setFilters(p => ({ ...p, contadorId })), []);
  const setUrgencia = useCallback((urgencia: DashboardFilters['urgencia']) => setFilters(p => ({ ...p, urgencia })), []);
  const setStatus = useCallback((status: string | null) => setFilters(p => ({ ...p, status })), []);
  const setOrdenacao = useCallback((ordenacao: OrdenacaoDashboard) => setFilters(p => ({ ...p, ordenacao })), []);
  const clearFilters = useCallback(() => setFilters({ search: '', contadorId: null, urgencia: 'todas', status: null, ordenacao: DEFAULT_ORDENACAO }), []);

  const hasActiveFilters = !!(
    filters.search ||
    filters.contadorId ||
    filters.urgencia !== 'todas' ||
    filters.status ||
    filters.ordenacao !== DEFAULT_ORDENACAO
  );

  return {
    filters,
    setSearch,
    setContadorId,
    setUrgencia,
    setStatus,
    setOrdenacao,
    clearFilters,
    declaracoesFiltradas,
    stats,
    hasActiveFilters,
  };
}
