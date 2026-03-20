import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { STATUS_LABELS } from '@/lib/formatters';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusColors: Record<string, string> = {
  aguardando_documentos: 'bg-amber-100 text-amber-800',
  documentacao_recebida: 'bg-blue-100 text-blue-800',
  declaracao_pronta: 'bg-emerald-100 text-emerald-800',
  transmitida: 'bg-slate-100 text-slate-800',
};

const statusOrder = ['aguardando_documentos', 'documentacao_recebida', 'declaracao_pronta', 'transmitida'];

interface Props {
  declaracao: any;
  papel: string | null;
  onChangeStatus: (status: string) => void;
}

export function DeclaracaoHeader({ declaracao, papel, onChangeStatus }: Props) {
  const navigate = useNavigate();
  const clienteNome = declaracao?.clientes?.nome || 'Cliente';
  const clienteId = declaracao?.clientes?.id;
  const currentIndex = statusOrder.indexOf(declaracao?.status);

  const getAvailableStatuses = () => {
    if (papel === 'dono') {
      return statusOrder.filter(s => s !== declaracao?.status);
    }
    // Collaborator can only advance
    return statusOrder.slice(currentIndex + 1);
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <div className="space-y-3">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <button onClick={() => navigate('/clientes')} className="hover:text-foreground transition-colors">Clientes</button>
        <ChevronRight className="h-3 w-3" />
        <button onClick={() => navigate(`/clientes/${clienteId}`)} className="hover:text-foreground transition-colors">{clienteNome}</button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Declaração {declaracao?.ano_base}</span>
      </nav>

      {/* Title + Status */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Declaração IRPF {declaracao?.ano_base} — {clienteNome}
        </h1>

        <div className="flex items-center gap-3">
          <Badge className={statusColors[declaracao?.status] || 'bg-muted text-muted-foreground'}>
            {STATUS_LABELS[declaracao?.status] || declaracao?.status}
          </Badge>

          {availableStatuses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Mover status <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableStatuses.map(s => (
                  <DropdownMenuItem key={s} onClick={() => onChangeStatus(s)}>
                    {STATUS_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
