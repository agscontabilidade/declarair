import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, Loader2 } from 'lucide-react';

interface AddonConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  addonNome: string;
  addonPreco: number;
  action: 'ativar' | 'desativar';
}

export function AddonConfirmModal({
  open, onClose, onConfirm, isLoading, addonNome, addonPreco, action,
}: AddonConfirmModalProps) {
  const isActivating = action === 'ativar';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center mb-3">
            {isActivating ? (
              <CreditCard className="h-7 w-7 text-accent" />
            ) : (
              <AlertTriangle className="h-7 w-7 text-warning" />
            )}
          </div>
          <DialogTitle className="text-center font-display text-xl">
            {isActivating ? `Ativar ${addonNome}?` : `Desativar ${addonNome}?`}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isActivating ? (
              <>
                Ao ativar o <strong>{addonNome}</strong>, será gerada uma cobrança
                de <strong className="text-accent">R$ {addonPreco.toFixed(2)}/mês</strong> que
                será adicionada à sua mensalidade. O pagamento deve ser realizado no ato da ativação.
              </>
            ) : (
              <>
                O recurso <strong>{addonNome}</strong> será desativado e removido
                da sua próxima fatura. Você pode reativá-lo a qualquer momento.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={isActivating
              ? 'w-full bg-accent hover:bg-accent/90 text-accent-foreground'
              : 'w-full'}
            variant={isActivating ? 'default' : 'destructive'}
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
            ) : isActivating ? (
              `Confirmar e Pagar — R$ ${addonPreco.toFixed(2)}/mês`
            ) : (
              'Confirmar Desativação'
            )}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="w-full">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
