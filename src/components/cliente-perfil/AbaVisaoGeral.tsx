import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_LABELS, formatCurrency } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, FileText } from 'lucide-react';
import { NovaDeclaracaoModal } from './NovaDeclaracaoModal';

const statusColors: Record<string, string> = {
  aguardando_documentos: 'bg-amber-100 text-amber-800',
  documentacao_recebida: 'bg-blue-100 text-blue-800',
  declaracao_pronta: 'bg-emerald-100 text-emerald-800',
  transmitida: 'bg-slate-100 text-slate-800',
};

const formStatusColors: Record<string, string> = {
  nao_iniciado: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-amber-100 text-amber-800',
  concluido: 'bg-emerald-100 text-emerald-800',
};

interface Props {
  declaracoes: any[];
  isLoading: boolean;
  contadores: { id: string; nome: string }[];
  onCriarDeclaracao: (input: { ano_base: number; contador_id: string | null }) => void;
  criandoDeclaracao: boolean;
  formularioStatus?: string;
}

export function AbaVisaoGeral({ declaracoes, isLoading, contadores, onCriarDeclaracao, criandoDeclaracao, formularioStatus }: Props) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário IR Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Formulário IR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className={formStatusColors[formularioStatus || 'nao_iniciado'] || 'bg-muted text-muted-foreground'}>
            {STATUS_LABELS[formularioStatus || 'nao_iniciado']}
          </Badge>
        </CardContent>
      </Card>

      {/* Declarações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Declarações</CardTitle>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Declaração
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {declaracoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Nenhuma declaração cadastrada</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setModalOpen(true)}>
                Criar primeira declaração
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {declaracoes.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold text-lg">{d.ano_base}</span>
                    <Badge className={statusColors[d.status] || 'bg-muted text-muted-foreground'}>
                      {STATUS_LABELS[d.status] || d.status}
                    </Badge>
                    {d.status === 'transmitida' && d.tipo_resultado && (
                      <span className={`text-sm font-medium ${d.tipo_resultado === 'restituicao' ? 'text-emerald-600' : d.tipo_resultado === 'pagamento' ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {STATUS_LABELS[d.tipo_resultado]}{d.valor_resultado ? `: ${formatCurrency(d.valor_resultado)}` : ''}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/declaracoes/${d.id}`)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NovaDeclaracaoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contadores={contadores}
        onSubmit={(data) => {
          onCriarDeclaracao(data);
          setModalOpen(false);
        }}
        isPending={criandoDeclaracao}
      />
    </div>
  );
}
