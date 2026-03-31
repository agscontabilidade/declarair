import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, QrCode, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useStripeCheckout } from '@/hooks/useStripe';
import { stripePromise } from '@/lib/stripe';
import { toast } from 'sonner';

const PLANOS = {
  pro: { nome: 'Pro', preco: 'R$ 29,90', valor: 29.9, features: ['3 declarações inclusas', 'Extras por R$ 9,90/cada', 'Até 5 usuários', 'Storage ilimitado', 'Malha Fina + Calculadora IR', 'Suporte Prioritário'] },
  profissional: { nome: 'Pro', preco: 'R$ 29,90', valor: 29.9, features: ['3 declarações inclusas', 'Extras por R$ 9,90/cada', 'Até 5 usuários', 'Storage ilimitado', 'Malha Fina + Calculadora IR', 'Suporte Prioritário'] },
};

type PlanoKey = keyof typeof PLANOS;

// Inner form that uses Stripe hooks (must be inside Elements provider)
function CheckoutForm({ plano, onSuccess }: { plano: typeof PLANOS.pro; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/meus-planos?payment=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Erro ao processar pagamento');
      setIsProcessing(false);
    } else {
      toast.success('Pagamento confirmado! Ativando seu plano...');
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: { address: { country: 'BR' } },
          },
        }}
      />
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        size="lg"
      >
        {isProcessing ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
        ) : (
          `Assinar ${plano.nome} — ${plano.preco}/mês`
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        🔒 Pagamento seguro processado pela Stripe. Seus dados estão protegidos.
      </p>
    </form>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planoId = (searchParams.get('plano') || 'pro') as PlanoKey;
  const fromCadastro = searchParams.get('from') === 'cadastro';
  const plano = PLANOS[planoId] || PLANOS.pro;

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  const createSub = useStripeCheckout();

  const handleStartCheckout = async () => {
    setIsCreating(true);
    try {
      const result = await createSub.mutateAsync({
        plano: planoId === 'profissional' ? 'pro' : planoId,
        paymentMethod,
      });
      if (result.clientSecret) {
        setClientSecret(result.clientSecret);
      }
    } catch {
      // Error already handled by hook
    } finally {
      setIsCreating(false);
    }
  };

  const successRedirect = fromCadastro ? '/onboarding' : '/dashboard';

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center space-y-6 py-12">
          <div className="h-20 w-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Pagamento confirmado!</h1>
          <p className="text-muted-foreground">
            Seu plano Pro foi ativado com sucesso. {fromCadastro ? 'Vamos configurar seu escritório!' : 'Aproveite todos os recursos!'}
          </p>
          <Button onClick={() => navigate(successRedirect)} size="lg" className="bg-accent hover:bg-accent/90">
            {fromCadastro ? 'Configurar Escritório' : 'Ir para o Dashboard'}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {!fromCadastro && (
          <Button variant="ghost" onClick={() => navigate('/meus-planos')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar aos planos
          </Button>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan summary */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className="bg-accent text-accent-foreground">{plano.nome}</Badge>
                <p className="text-2xl font-bold mt-2">{plano.preco}<span className="text-sm text-muted-foreground font-normal">/mês</span></p>
              </div>
              <div className="space-y-2">
                {plano.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              {!clientSecret ? (
                <div className="space-y-6">
                  {/* Payment method selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        paymentMethod === 'card'
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <CreditCard className="h-6 w-6 mx-auto mb-2 text-accent" />
                      <p className="font-medium text-sm">Cartão de Crédito</p>
                      <p className="text-xs text-muted-foreground">Ativação imediata</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        paymentMethod === 'pix'
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <QrCode className="h-6 w-6 mx-auto mb-2 text-accent" />
                      <p className="font-medium text-sm">PIX</p>
                      <p className="text-xs text-muted-foreground">Confirmação em segundos</p>
                    </button>
                  </div>

                  <Button
                    onClick={handleStartCheckout}
                    disabled={isCreating}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    size="lg"
                  >
                    {isCreating ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Preparando pagamento...</>
                    ) : (
                      'Continuar para pagamento'
                    )}
                  </Button>
                </div>
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#3B82F6',
                        borderRadius: '8px',
                      },
                    },
                    locale: 'pt-BR',
                  }}
                >
                  <CheckoutForm plano={plano} onSuccess={() => setSuccess(true)} />
                </Elements>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
