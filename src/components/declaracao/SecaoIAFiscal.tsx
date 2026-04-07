import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Brain, Sparkles, ShieldAlert, Receipt, Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBillingStatus } from '@/hooks/useBillingStatus';

interface Props {
  declaracaoId: string;
}

type TipoAnalise = 'analise' | 'deducoes' | 'riscos';

export function SecaoIAFiscal({ declaracaoId }: Props) {
  const navigate = useNavigate();
  const { features, loading: billingLoading } = useBillingStatus();
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(false);
  const [tipoAtual, setTipoAtual] = useState<TipoAnalise | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function executarAnalise(tipo: TipoAnalise) {
    setLoading(true);
    setResultado('');
    setTipoAtual(tipo);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ia-fiscal`;
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ declaracao_id: declaracaoId, tipo }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error('Stream não disponível');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setResultado(fullText);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setResultado(`❌ Erro: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (billingLoading) {
    return <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!features.calculadora_ir) {
    return (
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">IA Fiscal — Recurso Pro</p>
          <p className="text-sm text-muted-foreground mb-4">A análise fiscal com IA está disponível apenas no plano Pro.</p>
          <Button size="sm" onClick={() => navigate('/meus-planos')}>Fazer Upgrade</Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-accent" />
            IA Fiscal
          </CardTitle>
          <p className="text-xs text-muted-foreground">Análise inteligente da declaração usando inteligência artificial</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={tipoAtual === 'analise' ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => executarAnalise('analise')}
              disabled={loading}
            >
              <Sparkles className="h-4 w-4" /> Análise Completa
            </Button>
            <Button
              variant={tipoAtual === 'deducoes' ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => executarAnalise('deducoes')}
              disabled={loading}
            >
              <Receipt className="h-4 w-4" /> Sugerir Deduções
            </Button>
            <Button
              variant={tipoAtual === 'riscos' ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => executarAnalise('riscos')}
              disabled={loading}
            >
              <ShieldAlert className="h-4 w-4" /> Verificar Riscos
            </Button>
          </div>
        </CardContent>
      </Card>

      {(loading || resultado) && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Brain className="h-3 w-3" />
                {tipoAtual === 'analise' ? 'Análise Completa' : tipoAtual === 'deducoes' ? 'Sugestões de Deduções' : 'Verificação de Riscos'}
              </Badge>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm leading-relaxed">
              {resultado || <span className="text-muted-foreground animate-pulse">Analisando dados fiscais...</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
