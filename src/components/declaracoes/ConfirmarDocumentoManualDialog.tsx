import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

export type TipoDoc = 'declaracao' | 'recibo' | 'mei' | 'darf';

export interface ManualConfirmacaoPayload {
  cpf?: string;
  ano?: number;
  tipo_resultado?: 'restituicao' | 'pagamento' | 'nenhum';
  valor_resultado?: number;
  subtipo?: 'dirpf' | 'saida_definitiva' | 'comunicacao_saida';
  numero_recibo?: string;
  data_transmissao?: string;
  cnpj?: string;
  codigo_receita?: string;
  valor_principal?: number;
  valor_total?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipo: TipoDoc;
  motivo: string;
  isSubmitting: boolean;
  onConfirm: (payload: ManualConfirmacaoPayload) => void;
}

const titulos: Record<TipoDoc, string> = {
  declaracao: 'Confirmar dados da Declaração',
  recibo: 'Confirmar dados do Recibo',
  mei: 'Confirmar dados da DASN-SIMEI (MEI)',
  darf: 'Confirmar dados do DARF',
};

export function ConfirmarDocumentoManualDialog({ open, onOpenChange, tipo, motivo, isSubmitting, onConfirm }: Props) {
  const [tipoResultado, setTipoResultado] = useState<'restituicao' | 'pagamento' | 'nenhum'>('nenhum');
  const [valorResultado, setValorResultado] = useState<string>('');
  const [numeroRecibo, setNumeroRecibo] = useState('');
  const [dataTransmissao, setDataTransmissao] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [codigoReceita, setCodigoReceita] = useState('0211');
  const [valorPrincipal, setValorPrincipal] = useState('');
  const [valorTotal, setValorTotal] = useState('');

  const parseMoney = (s: string) => Number(s.replace(/\./g, '').replace(',', '.')) || 0;

  function handleSubmit() {
    const base: ManualConfirmacaoPayload = {};
    if (tipo === 'declaracao') {
      base.tipo_resultado = tipoResultado;
      base.valor_resultado = tipoResultado === 'nenhum' ? 0 : parseMoney(valorResultado);
    } else if (tipo === 'recibo') {
      base.numero_recibo = numeroRecibo.trim();
      base.data_transmissao = dataTransmissao;
    } else if (tipo === 'mei') {
      base.cnpj = cnpj.replace(/\D/g, '');
      base.numero_recibo = numeroRecibo.trim() || undefined;
      base.data_transmissao = dataTransmissao || undefined;
    } else if (tipo === 'darf') {
      base.codigo_receita = codigoReceita;
      base.valor_principal = parseMoney(valorPrincipal);
      base.valor_total = parseMoney(valorTotal);
      base.data_transmissao = dataTransmissao || undefined;
    }
    onConfirm(base);
  }

  const valid = (() => {
    if (tipo === 'declaracao') return tipoResultado === 'nenhum' || parseMoney(valorResultado) > 0;
    if (tipo === 'recibo') return numeroRecibo.trim().length >= 4 && !!dataTransmissao;
    if (tipo === 'mei') return cnpj.replace(/\D/g, '').length === 14;
    if (tipo === 'darf') return parseMoney(valorPrincipal) > 0 && parseMoney(valorTotal) > 0;
    return false;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titulos[tipo]}</DialogTitle>
          <DialogDescription>
            O arquivo foi anexado mas não pôde ser lido automaticamente. Confirme os dados para registrar.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{motivo}</AlertDescription>
        </Alert>

        <div className="space-y-3">
          {tipo === 'declaracao' && (
            <>
              <div>
                <Label>Resultado da declaração</Label>
                <Select value={tipoResultado} onValueChange={(v: 'restituicao' | 'pagamento' | 'nenhum') => setTipoResultado(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">Sem imposto (nem pagar nem restituir)</SelectItem>
                    <SelectItem value="restituicao">Imposto a Restituir</SelectItem>
                    <SelectItem value="pagamento">Imposto a Pagar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {tipoResultado !== 'nenhum' && (
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    placeholder="0,00"
                    value={valorResultado}
                    onChange={(e) => setValorResultado(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {tipo === 'recibo' && (
            <>
              <div>
                <Label>Número do recibo</Label>
                <Input
                  placeholder="Ex.: 12.34.56.78.90-12"
                  value={numeroRecibo}
                  onChange={(e) => setNumeroRecibo(e.target.value)}
                />
              </div>
              <div>
                <Label>Data de transmissão</Label>
                <Input type="date" value={dataTransmissao} onChange={(e) => setDataTransmissao(e.target.value)} />
              </div>
            </>
          )}

          {tipo === 'mei' && (
            <>
              <div>
                <Label>CNPJ do MEI</Label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                />
              </div>
              <div>
                <Label>Número do recibo (opcional)</Label>
                <Input value={numeroRecibo} onChange={(e) => setNumeroRecibo(e.target.value)} />
              </div>
              <div>
                <Label>Data de transmissão (opcional)</Label>
                <Input type="date" value={dataTransmissao} onChange={(e) => setDataTransmissao(e.target.value)} />
              </div>
            </>
          )}

          {tipo === 'darf' && (
            <>
              <div>
                <Label>Código da Receita</Label>
                <Select value={codigoReceita} onValueChange={setCodigoReceita}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0211">0211 — IRPF Ajuste Anual</SelectItem>
                    <SelectItem value="4600">4600 — Carnê-Leão</SelectItem>
                    <SelectItem value="6015">6015 — Ganhos de Capital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Valor principal (R$)</Label>
                  <Input placeholder="0,00" value={valorPrincipal} onChange={(e) => setValorPrincipal(e.target.value)} />
                </div>
                <div>
                  <Label>Valor total (R$)</Label>
                  <Input placeholder="0,00" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Data de vencimento (opcional)</Label>
                <Input type="date" value={dataTransmissao} onChange={(e) => setDataTransmissao(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar e registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
