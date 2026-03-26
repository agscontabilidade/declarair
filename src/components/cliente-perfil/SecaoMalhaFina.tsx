import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Search, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SecaoMalhaFinaProps {
  clienteId: string;
  cpf: string;
}

export default function SecaoMalhaFina({ clienteId, cpf }: SecaoMalhaFinaProps) {
  const queryClient = useQueryClient();

  const { data: consultas = [] } = useQuery({
    queryKey: ['malha-fina-cliente', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('malha_fina_consultas')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const consultarCPF = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('consulta-rfb', {
        body: { cpf, consulta_id: consultas[0]?.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data.interpretacao?.alertas?.length > 0) {
        toast.warning('Atenção: CPF com alertas', { description: data.interpretacao.alertas[0] });
      } else {
        toast.success('CPF regular na Receita Federal');
      }
      queryClient.invalidateQueries({ queryKey: ['malha-fina-cliente', clienteId] });
    },
    onError: (err: Error) => {
      toast.error('Erro ao consultar CPF', { description: err.message });
    },
  });

  const ultimaConsulta = consultas[0] as Record<string, unknown> | undefined;
  const resultadoJson = ultimaConsulta?.resultado_json as Record<string, unknown> | undefined;
  const interpretacao = resultadoJson?.interpretacao as Record<string, unknown> | undefined;

  const getBadgeRisco = (risco: string) => {
    switch (risco) {
      case 'baixo': return <Badge className="bg-emerald-100 text-emerald-800">Baixo Risco</Badge>;
      case 'medio': return <Badge className="bg-amber-100 text-amber-800">Médio Risco</Badge>;
      case 'alto': return <Badge className="bg-destructive/10 text-destructive">Alto Risco</Badge>;
      default: return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              Consulta Receita Federal
            </CardTitle>
            <CardDescription>Situação cadastral do CPF (via BrasilAPI)</CardDescription>
          </div>
          <Button onClick={() => consultarCPF.mutate()} disabled={consultarCPF.isPending} size="sm">
            {consultarCPF.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Consultando...</>
            ) : (
              <><Search className="mr-2 h-4 w-4" />Consultar CPF</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {ultimaConsulta ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Situação</p>
                <p className="font-semibold text-sm">{ultimaConsulta.situacao_cadastral as string || ultimaConsulta.status_rfb as string}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Risco</p>
                <div className="mt-1">{getBadgeRisco((interpretacao?.risco_malha_fina as string) || 'desconhecido')}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Nome RFB</p>
                <p className="font-semibold text-sm truncate">{(interpretacao?.nome as string) || '—'}</p>
              </div>
            </div>

            {(interpretacao?.alertas as string[])?.length > 0 && (
              <div className="space-y-2">
                {(interpretacao!.alertas as string[]).map((alerta: string, i: number) => (
                  <Alert key={i} className="border-l-4 border-amber-500">
                    <AlertDescription>{alerta}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {!(interpretacao?.alertas as string[])?.length && interpretacao && (
              <Alert className="border-l-4 border-emerald-500 bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <AlertDescription className="text-emerald-800">CPF regular — Apto para declaração de IR</AlertDescription>
              </Alert>
            )}

            <p className="text-xs text-muted-foreground">
              Última consulta: {ultimaConsulta.ultima_consulta 
                ? new Date(ultimaConsulta.ultima_consulta as string).toLocaleString('pt-BR') 
                : '—'}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>Nenhuma consulta realizada</p>
            <p className="text-sm">Clique em "Consultar CPF" para verificar a situação</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
