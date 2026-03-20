import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, STATUS_LABELS } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Copy, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  declaracao: any;
  onSave: (data: { tipo_resultado: string; valor_resultado: number | null; numero_recibo: string }) => void;
  saving: boolean;
}

export function SecaoResultado({ declaracao, onSave, saving }: Props) {
  const [tipoResultado, setTipoResultado] = useState(declaracao?.tipo_resultado || '');
  const [valorResultado, setValorResultado] = useState(declaracao?.valor_resultado?.toString() || '');
  const [numeroRecibo, setNumeroRecibo] = useState(declaracao?.numero_recibo || '');

  useEffect(() => {
    setTipoResultado(declaracao?.tipo_resultado || '');
    setValorResultado(declaracao?.valor_resultado?.toString() || '');
    setNumeroRecibo(declaracao?.numero_recibo || '');
  }, [declaracao?.tipo_resultado, declaracao?.valor_resultado, declaracao?.numero_recibo]);

  const isTransmitida = declaracao?.status === 'transmitida';
  const readOnly = isTransmitida && !!declaracao?.numero_recibo;

  const handleCopyRecibo = () => {
    navigator.clipboard.writeText(numeroRecibo);
    toast.success('Número do recibo copiado!');
  };

  const handleSave = () => {
    onSave({
      tipo_resultado: tipoResultado,
      valor_resultado: tipoResultado !== 'nenhum' && valorResultado ? parseFloat(valorResultado) : null,
      numero_recibo: numeroRecibo,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resultado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Resultado</Label>
            {readOnly ? (
              <div className="flex items-center gap-2 h-10">
                {tipoResultado === 'restituicao' && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                {tipoResultado === 'pagamento' && <TrendingDown className="h-4 w-4 text-red-600" />}
                <span className="font-medium">{STATUS_LABELS[tipoResultado] || '-'}</span>
              </div>
            ) : (
              <Select value={tipoResultado} onValueChange={setTipoResultado}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="restituicao">Restituição</SelectItem>
                  <SelectItem value="pagamento">Pagamento</SelectItem>
                  <SelectItem value="nenhum">Nenhum</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Valor</Label>
            {readOnly ? (
              <p className={`text-lg font-bold h-10 flex items-center ${tipoResultado === 'restituicao' ? 'text-emerald-600' : tipoResultado === 'pagamento' ? 'text-red-600' : 'text-muted-foreground'}`}>
                {valorResultado ? formatCurrency(parseFloat(valorResultado)) : '-'}
              </p>
            ) : (
              <Input
                type="number"
                step="0.01"
                value={valorResultado}
                onChange={e => setValorResultado(e.target.value)}
                placeholder="0,00"
                disabled={tipoResultado === 'nenhum'}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Número do Recibo</Label>
            {readOnly ? (
              <button
                onClick={handleCopyRecibo}
                className="flex items-center gap-2 h-10 text-sm font-medium hover:text-accent transition-colors"
              >
                {numeroRecibo || '-'}
                {numeroRecibo && <Copy className="h-3 w-3" />}
              </button>
            ) : (
              <Input
                value={numeroRecibo}
                onChange={e => setNumeroRecibo(e.target.value)}
                placeholder="Número do recibo"
              />
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Salvando...' : 'Salvar Resultado'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
