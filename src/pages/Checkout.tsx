import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, CreditCard, QrCode, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { useCreateSubscription } from '@/hooks/useBilling';

const PLANOS = {
  starter: { nome: 'Starter', preco: 'R$ 29,90', valor: 29.9, features: ['10 declarações', '1 usuário', '10 GB storage', 'Malha Fina', 'Calculadora IR', 'Chat'] },
  profissional: { nome: 'Profissional', preco: 'R$ 49,90', valor: 49.9, features: ['20 declarações', '5 usuários', '30 GB storage', 'Whitelabel', 'Malha Fina', 'Calculadora IR', 'Chat', 'Afiliados'] },
  enterprise: { nome: 'Enterprise', preco: 'R$ 199,90', valor: 199.9, features: ['Declarações ilimitadas', 'Usuários ilimitados', 'Storage personalizado', 'Tudo incluso', 'Suporte dedicado'] },
};

type PlanoKey = keyof typeof PLANOS;

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planoId = (searchParams.get('plano') || 'profissional') as PlanoKey;
  const plano = PLANOS[planoId] || PLANOS.profissional;

  const [billingType, setBillingType] = useState('PIX');
  const [cardData, setCardData] = useState({ holderName: '', number: '', expiryMonth: '', expiryYear: '', ccv: '' });
  const [holderInfo, setHolderInfo] = useState({ name: '', email: '', cpfCnpj: '', postalCode: '', phone: '' });

  const createSub = useCreateSubscription();
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const handleSubmit = async () => {
    const body: any = { plano: planoId, billingType };

    if (billingType === 'CREDIT_CARD') {
      body.creditCard = {
        holderName: cardData.holderName,
        number: cardData.number.replace(/\D/g, ''),
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear,
        ccv: cardData.ccv,
      };
      body.creditCardHolderInfo = {
        name: holderInfo.name,
        email: holderInfo.email,
        cpfCnpj: holderInfo.cpfCnpj.replace(/\D/g, ''),
        postalCode: holderInfo.postalCode.replace(/\D/g, ''),
        phone: holderInfo.phone.replace(/\D/g, ''),
      };
    }

    const result = await createSub.mutateAsync(body);
    if (result.paymentInfo) {
      setPaymentResult(result.paymentInfo);
    } else {
      navigate('/meus-planos');
    }
  };

  if (paymentResult) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate('/planos')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar aos planos
          </Button>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Pagamento Gerado</CardTitle>
              <p className="text-sm text-muted-foreground">
                {billingType === 'PIX' ? 'Escaneie o QR Code ou copie o código PIX' : 'Use o boleto abaixo para pagar'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              {paymentResult.pixQrCodeUrl && (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={`data:image/png;base64,${paymentResult.pixQrCodeUrl}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 border rounded-lg"
                  />
                  <div className="w-full">
                    <Label className="text-xs text-muted-foreground">Código PIX (copie e cole)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={paymentResult.pixQrCode || ''} readOnly className="text-xs" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { navigator.clipboard.writeText(paymentResult.pixQrCode); }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {paymentResult.boletoUrl && (
                <div className="space-y-3">
                  {paymentResult.boletoLinhaDigitavel && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Linha Digitável</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={paymentResult.boletoLinhaDigitavel} readOnly className="text-xs" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { navigator.clipboard.writeText(paymentResult.boletoLinhaDigitavel); }}
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}
                  <Button asChild className="w-full">
                    <a href={paymentResult.boletoUrl} target="_blank" rel="noopener noreferrer">
                      Abrir Boleto
                    </a>
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">
                Seu plano será ativado automaticamente após a confirmação do pagamento.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/planos')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar aos planos
        </Button>

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
                    <Check className="h-3.5 w-3.5 text-success" />
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
              <Tabs value={billingType} onValueChange={setBillingType}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="PIX" className="gap-2"><QrCode className="h-4 w-4" /> PIX</TabsTrigger>
                  <TabsTrigger value="CREDIT_CARD" className="gap-2"><CreditCard className="h-4 w-4" /> Cartão</TabsTrigger>
                  <TabsTrigger value="BOLETO" className="gap-2"><FileText className="h-4 w-4" /> Boleto</TabsTrigger>
                </TabsList>

                <TabsContent value="PIX" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Ao confirmar, será gerado um QR Code PIX para pagamento imediato. O plano será ativado assim que o pagamento for confirmado.
                  </p>
                </TabsContent>

                <TabsContent value="CREDIT_CARD" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label>Nome no cartão</Label>
                      <Input value={cardData.holderName} onChange={(e) => setCardData(p => ({ ...p, holderName: e.target.value }))} placeholder="Como está no cartão" />
                    </div>
                    <div>
                      <Label>Número do cartão</Label>
                      <Input value={cardData.number} onChange={(e) => setCardData(p => ({ ...p, number: e.target.value }))} placeholder="0000 0000 0000 0000" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Mês</Label>
                        <Input value={cardData.expiryMonth} onChange={(e) => setCardData(p => ({ ...p, expiryMonth: e.target.value }))} placeholder="MM" maxLength={2} />
                      </div>
                      <div>
                        <Label>Ano</Label>
                        <Input value={cardData.expiryYear} onChange={(e) => setCardData(p => ({ ...p, expiryYear: e.target.value }))} placeholder="AAAA" maxLength={4} />
                      </div>
                      <div>
                        <Label>CVV</Label>
                        <Input value={cardData.ccv} onChange={(e) => setCardData(p => ({ ...p, ccv: e.target.value }))} placeholder="000" maxLength={4} />
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-medium">Dados do titular</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Nome completo</Label>
                        <Input value={holderInfo.name} onChange={(e) => setHolderInfo(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={holderInfo.email} onChange={(e) => setHolderInfo(p => ({ ...p, email: e.target.value }))} type="email" />
                      </div>
                      <div>
                        <Label>CPF/CNPJ</Label>
                        <Input value={holderInfo.cpfCnpj} onChange={(e) => setHolderInfo(p => ({ ...p, cpfCnpj: e.target.value }))} />
                      </div>
                      <div>
                        <Label>CEP</Label>
                        <Input value={holderInfo.postalCode} onChange={(e) => setHolderInfo(p => ({ ...p, postalCode: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Telefone</Label>
                        <Input value={holderInfo.phone} onChange={(e) => setHolderInfo(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="BOLETO" className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Ao confirmar, será gerado um boleto bancário. O plano será ativado após a compensação do pagamento (até 3 dias úteis).
                  </p>
                </TabsContent>
              </Tabs>

              <Button
                onClick={handleSubmit}
                disabled={createSub.isPending}
                className="w-full mt-6 bg-accent hover:bg-accent/90"
                size="lg"
              >
                {createSub.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processando...</>
                ) : (
                  `Assinar ${plano.nome} — ${plano.preco}/mês`
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
