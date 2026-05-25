import { ArrowUpDown, DollarSign, FileCheck2, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type {
  OrdenacaoClientes,
  FiltroProcuracao,
  FiltroCobranca,
} from '@/hooks/useClientes';

interface Props {
  ordenacao: OrdenacaoClientes;
  onOrdenacaoChange: (v: OrdenacaoClientes) => void;
  filtroProcuracao: FiltroProcuracao;
  onFiltroProcuracaoChange: (v: FiltroProcuracao) => void;
  filtroCobranca: FiltroCobranca;
  onFiltroCobrancaChange: (v: FiltroCobranca) => void;
}

export function ClientesFilters({
  ordenacao, onOrdenacaoChange,
  filtroProcuracao, onFiltroProcuracaoChange,
  filtroCobranca, onFiltroCobrancaChange,
}: Props) {
  const hasActiveFilters =
    ordenacao !== 'alfabetica_az' ||
    filtroProcuracao !== 'todas' ||
    filtroCobranca !== 'todas';

  const clearAll = () => {
    onOrdenacaoChange('alfabetica_az');
    onFiltroProcuracaoChange('todas');
    onFiltroCobrancaChange('todas');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={ordenacao} onValueChange={(v) => onOrdenacaoChange(v as OrdenacaoClientes)}>
        <SelectTrigger className="w-[200px] gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="alfabetica_az">Nome (A → Z)</SelectItem>
          <SelectItem value="alfabetica_za">Nome (Z → A)</SelectItem>
          <SelectItem value="cadastro_recente">Cadastro mais recente</SelectItem>
          <SelectItem value="cadastro_antigo">Cadastro mais antigo</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filtroCobranca} onValueChange={(v) => onFiltroCobrancaChange(v as FiltroCobranca)}>
        <SelectTrigger className="w-[180px] gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas cobranças</SelectItem>
          <SelectItem value="gerada">Cobrança gerada</SelectItem>
          <SelectItem value="nao_gerada">Sem cobrança</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filtroProcuracao} onValueChange={(v) => onFiltroProcuracaoChange(v as FiltroProcuracao)}>
        <SelectTrigger className="w-[200px] gap-2">
          <FileCheck2 className="h-4 w-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas procurações</SelectItem>
          <SelectItem value="ativa">e-CAC ativa</SelectItem>
          <SelectItem value="pendente">e-CAC pendente</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
