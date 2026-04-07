import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { STATUS_LABELS, formatCurrency } from '@/lib/formatters';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, FileText, AlertCircle, Zap, ShoppingCart } from 'lucide-react';
import { NovaDeclaracaoModal } from './NovaDeclaracaoModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useUsageStatus } from '@/hooks/useUsageStatus';
import { formatarPreco, PRECOS } from '@/lib/constants/planos';

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const usage = useUsageStatus();

  function handleNovaDeclaracao() {
    if (usage.level === 'blocked') {
      setShowUpgradeModal(true);
      return;
    }
    setModalOpen(true);
  }

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
          <CardTitle className="text-base">Formulário IR</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge className={formStatusColors[formularioStatus || 'nao_iniciado']}>
            {formularioStatus === 'concluido' ? 'Concluído' :
             formularioStatus === 'em_andamento' ? 'Em andamento' : 'Não iniciado'}
          </Badge>
        </CardContent>
      </Card>

      {/* Declarações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Declarações</CardTitle>
            <Button size="sm" onClick={handleNovaDeclaracao}>
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
              <Button variant="outline" size="sm" className="mt-3" onClick={handleNovaDeclaracao}>
                Criar primeira declaração
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {declaracoes.map((d, i) => (
                <div key={d.id || i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">IR {d.ano_base}</span>
                      <Badge variant="outline" className={statusColors[d.status] || ''}>
                        {STATUS_LABELS[d.status] || d.status}
                      </Badge>
                    </div>
                    {d.tipo_resultado && (
                      <span className="text-xs text-muted-foreground">
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

      {/* Modal de Limite Atingido */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">
              {usage.plano === 'free' ? 'Limite do Plano Free Atingido' : 'Sem Declarações Disponíveis'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {usage.plano === 'free' ? (
                <>
                  Você já usou sua declaração de teste ({usage.usadas}/{usage.limite}).
                  Faça upgrade para o plano Pro para criar mais declarações.
                </>
              ) : (
                <>
                  Você usou todas as suas declarações ({usage.usadas}/{usage.limite}).
                  Compre declarações extras — cada uma custa {formatarPreco(PRECOS.DECLARACAO_EXTRA.preco)}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {usage.plano === 'free' ? (
              <Button onClick={() => { setShowUpgradeModal(false); navigate('/meus-planos'); }} className="w-full gap-2">
                <Zap className="h-4 w-4" />
                Fazer Upgrade para o Pro
              </Button>
            ) : (
              <Button onClick={() => { setShowUpgradeModal(false); navigate('/addons?tab=declaracoes'); }} className="w-full gap-2">
                <ShoppingCart className="h-4 w-4" />
                Comprar Declarações Extras
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowUpgradeModal(false)} className="w-full">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
