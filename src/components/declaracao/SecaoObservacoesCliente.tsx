import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquareText, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/lib/formatters';

interface Props {
  declaracaoId: string;
  escritorioId: string;
  clienteNome?: string;
  observacao: string;
  atualizadoEm: string | null;
  lidaEm: string | null;
}

export function SecaoObservacoesCliente({
  declaracaoId,
  escritorioId,
  clienteNome,
  observacao,
  atualizadoEm,
  lidaEm,
}: Props) {
  const queryClient = useQueryClient();
  const [marcandoLida, setMarcandoLida] = useState(false);
  const [localLida, setLocalLida] = useState<string | null>(lidaEm);
  const autoRanRef = useRef(false);

  const naoLida = !localLida;

  const marcarLida = async (opts?: { silent?: boolean }) => {
    if (!naoLida) return;
    if (!opts?.silent) setMarcandoLida(true);
    try {
      const agora = new Date().toISOString();
      const { error } = await supabase
        .from('declaracoes')
        .update({ observacoes_cliente_lida_em: agora })
        .eq('id', declaracaoId);
      if (error) throw error;
      setLocalLida(agora);
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracaoId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes'] });
      queryClient.invalidateQueries({ queryKey: ['declaracoes-lista', escritorioId] });
      queryClient.invalidateQueries({ queryKey: ['clientes', escritorioId] });
      queryClient.invalidateQueries({ queryKey: ['clientes-com-observacao', escritorioId] });
    } catch (err) {
      console.error('[obs-cliente] erro ao marcar como lida', err);
    } finally {
      if (!opts?.silent) setMarcandoLida(false);
    }
  };

  // Auto-marca como lida após 3s
  useEffect(() => {
    if (autoRanRef.current || !naoLida) return;
    autoRanRef.current = true;
    const t = setTimeout(() => marcarLida({ silent: true }), 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naoLida, declaracaoId]);

  return (
    <Card
      className={
        naoLida
          ? 'border-2 border-amber-400/70 bg-amber-50/70 dark:bg-amber-950/25 dark:border-amber-500/50 shadow-sm'
          : 'border border-amber-300/40 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-600/30'
      }
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
            <MessageSquareText className="h-5 w-5 text-amber-700 dark:text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Detalhes enviados pelo cliente
              </h3>
              {naoLida && (
                <span className="text-[10px] uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                  Não lida
                </span>
              )}
            </div>
            {atualizadoEm && (
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                {clienteNome ? `${clienteNome} · ` : ''}atualizado em {formatDate(atualizadoEm)}
              </p>
            )}
            <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-3 leading-relaxed">
              {observacao}
            </p>

            {naoLida && (
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => marcarLida()}
                  disabled={marcandoLida}
                  className="border-amber-400 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/30"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" /> Marcar como lida
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
