import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquareText, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const MAX_LEN = 2000;

interface Props {
  declaracaoId: string;
  escritorioId: string;
  clienteNome: string;
  initialValue: string | null;
}

export function ObservacoesParaContador({ declaracaoId, escritorioId, clienteNome, initialValue }: Props) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNotifyRef = useRef<number>(0);
  const dirtyRef = useRef(false);

  useEffect(() => {
    // só hidrata na primeira carga / quando muda a declaração
    setText(initialValue ?? '');
    dirtyRef.current = false;
  }, [declaracaoId, initialValue]);

  const persist = useCallback(async (value: string) => {
    const clean = value.trim().slice(0, MAX_LEN);
    setSaving(true);
    try {
      const { error } = await supabase
        .from('declaracoes')
        .update({
          observacoes_cliente: clean || null,
          observacoes_cliente_atualizado_em: new Date().toISOString(),
          observacoes_cliente_lida_em: null,
        })
        .eq('id', declaracaoId);
      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2200);

      // Anti-spam: 1 notificação a cada 2 min
      const now = Date.now();
      if (clean && now - lastNotifyRef.current > 2 * 60 * 1000) {
        lastNotifyRef.current = now;
        await supabase.from('notificacoes').insert({
          escritorio_id: escritorioId,
          titulo: '💬 Detalhes do cliente',
          mensagem: `${clienteNome} adicionou detalhes na declaração.`,
          link_destino: `/declaracoes/${declaracaoId}`,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['cliente-declaracao-ativa'] });
    } catch (err) {
      console.error('[observacoes-cliente] erro ao salvar', err);
      toast.error('Não foi possível salvar as observações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }, [declaracaoId, escritorioId, clienteNome, queryClient]);

  const handleChange = (value: string) => {
    const limited = value.slice(0, MAX_LEN);
    setText(limited);
    setSaved(false);
    dirtyRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        persist(limited);
      }
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Card className="border-2 border-amber-400/60 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-500/40 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
            <MessageSquareText className="h-5 w-5 text-amber-700 dark:text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-base font-semibold text-amber-900 dark:text-amber-100">
                Detalhes para o seu contador
              </h3>
              <span className="text-[10px] uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                Importante
              </span>
            </div>
            <p className="text-sm text-amber-800/90 dark:text-amber-200/90 mt-0.5">
              Conte qualquer detalhe relevante: rendimentos extras, mudanças no ano, dúvidas, observações sobre documentos enviados. Tudo o que escrever aqui chega direto ao seu contador.
            </p>
          </div>
        </div>

        <Textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Ex.: Esqueci de enviar o comprovante de aluguel de março — vou anexar amanhã. Também recebi uma restituição de plano de saúde que não estava no informe…"
          rows={5}
          maxLength={MAX_LEN}
          className="resize-none bg-background/80 border-amber-300/60 dark:border-amber-600/40 focus-visible:ring-amber-500"
        />

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-amber-700/80 dark:text-amber-300/80 tabular-nums">
            {text.length}/{MAX_LEN}
          </span>
          <span className="text-xs flex items-center gap-1 text-amber-700 dark:text-amber-300">
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Salvando…
              </>
            ) : saved ? (
              <>
                <Check className="h-3 w-3" /> Salvo automaticamente
              </>
            ) : (
              <span className="text-muted-foreground">Salva automaticamente após digitar</span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
