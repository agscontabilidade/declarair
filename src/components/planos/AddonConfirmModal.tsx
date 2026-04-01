import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';

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

// ── Payment modal for when clientSecret is returned ──

function AddonPaymentForm({ onSuccess, addonNome, addonPreco }: {
  onSuccess: () => void;
  addonNome: string;
  addonPreco: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMsg(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/meus-planos?addon=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMsg(error.message || 'Erro ao processar pagamento');
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: { address: { country: 'BR' } },
          },
        }}
      />
      {errorMsg && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        size="lg"
      >
        {isProcessing ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
        ) : (
          `Pagar R$ ${addonPreco.toFixed(2)}/mês — ${addonNome}`
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        🔒 Pagamento seguro processado pela Stripe.
      </p>
    </form>
  );
}

interface AddonPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientSecret: string;
  addonNome: string;
  addonPreco: number;
}

export function AddonPaymentModal({
  open, onClose, onSuccess, clientSecret, addonNome, addonPreco,
}: AddonPaymentModalProps) {
  const [paid, setPaid] = useState(false);

  if (paid) {
    return (
      <Dialog open={open} onOpenChange={() => { onSuccess(); }}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center space-y-4 py-4">
            <div className="h-16 w-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold">{addonNome} ativado!</h2>
            <p className="text-muted-foreground text-sm">
              O recurso foi ativado e adicionado à sua mensalidade.
            </p>
            <Button onClick={onSuccess} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Voltar aos Recursos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center font-display text-xl">
            Pagamento — {addonNome}
          </DialogTitle>
          <DialogDescription className="text-center">
            Insira os dados do cartão para ativar o recurso.
          </DialogDescription>
        </DialogHeader>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: { colorPrimary: '#3B82F6', borderRadius: '8px' },
            },
            locale: 'pt-BR',
          }}
        >
          <AddonPaymentForm
            onSuccess={() => setPaid(true)}
            addonNome={addonNome}
            addonPreco={addonPreco}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
