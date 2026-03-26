import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ArrowRight, Upload, MessageCircle, Calculator, Edit3 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Atividade = Tables<'declaracao_atividades'>;

const TIPO_ICONS: Record<string, React.ElementType> = {
  status_change: ArrowRight,
  documento_recebido: Upload,
  mensagem: MessageCircle,
  calculo: Calculator,
  edicao: Edit3,
};

const TIPO_COLORS: Record<string, string> = {
  status_change: 'bg-accent text-accent-foreground',
  documento_recebido: 'bg-success text-success-foreground',
  mensagem: 'bg-primary text-primary-foreground',
  calculo: 'bg-warning text-warning-foreground',
  edicao: 'bg-muted text-muted-foreground',
};

export function SecaoTimeline({ declaracaoId }: { declaracaoId: string }) {
  const { data: atividades = [], isLoading } = useQuery({
    queryKey: ['declaracao-atividades', declaracaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('declaracao_atividades')
        .select('*')
        .eq('declaracao_id', declaracaoId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Atividade[];
    },
    enabled: !!declaracaoId,
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          Histórico de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {atividades.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade registrada</p>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {atividades.map((a) => {
                const Icon = TIPO_ICONS[a.tipo] || Clock;
                const color = TIPO_COLORS[a.tipo] || 'bg-muted text-muted-foreground';
                return (
                  <div key={a.id} className="flex items-start gap-3 relative">
                    <div className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm">{a.descricao}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.usuario_nome && <span className="font-medium">{a.usuario_nome}</span>}
                        {a.usuario_nome && ' — '}
                        {new Date(a.created_at).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
