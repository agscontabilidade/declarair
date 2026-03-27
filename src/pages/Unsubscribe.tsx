import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, MailX } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Status = 'loading' | 'valid' | 'already_unsubscribed' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [status, setStatus] = useState<Status>('loading');
  const [isProcessing, setIsProcessing] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }

    fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid === false && data.reason === 'already_unsubscribed') {
          setStatus('already_unsubscribed');
        } else if (data.valid) {
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/handle-email-unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
      } else if (data.reason === 'already_unsubscribed') {
        setStatus('already_unsubscribed');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <MailX className="h-6 w-6 text-muted-foreground" />
            Cancelar inscrição
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verificando...</p>
            </div>
          )}

          {status === 'valid' && (
            <>
              <p className="text-muted-foreground">
                Deseja deixar de receber emails do DeclaraIR? Você pode reativar a qualquer momento.
              </p>
              <Button onClick={handleUnsubscribe} disabled={isProcessing} variant="destructive" className="w-full">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Confirmar cancelamento'
                )}
              </Button>
            </>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <p className="font-medium">Inscrição cancelada com sucesso!</p>
              <p className="text-sm text-muted-foreground">
                Você não receberá mais emails transacionais do DeclaraIR.
              </p>
            </div>
          )}

          {status === 'already_unsubscribed' && (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Inscrição já foi cancelada</p>
              <p className="text-sm text-muted-foreground">
                Você já cancelou sua inscrição anteriormente.
              </p>
            </div>
          )}

          {status === 'invalid' && (
            <div className="flex flex-col items-center gap-2">
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="font-medium">Link inválido</p>
              <p className="text-sm text-muted-foreground">
                Este link de cancelamento é inválido ou expirou.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="font-medium">Erro ao processar</p>
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro. Tente novamente mais tarde.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
