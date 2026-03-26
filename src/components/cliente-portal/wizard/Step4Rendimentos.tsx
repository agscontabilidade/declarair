import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import type { RendimentoTributavel, RendimentoIsento, RendimentoFinanceiro, AluguelRecebido } from '@/lib/types/formularioCliente';
import type { WizardStepProps } from '../WizardFormulario';

export default function Step4Rendimentos({ data, onUpdate }: WizardStepProps) {
  const [tributaveis, setTributaveis] = useState<RendimentoTributavel[]>(data.rendimentos?.tributaveis || []);
  const [isentos, setIsentos] = useState<RendimentoIsento[]>(data.rendimentos?.isentos || []);
  const [financeiros, setFinanceiros] = useState<RendimentoFinanceiro[]>(data.rendimentos?.financeiros || []);
  const [alugueis, setAlugueis] = useState<AluguelRecebido[]>(data.rendimentos?.alugueis || []);

  useEffect(() => {
    const total = tributaveis.length + isentos.length + financeiros.length + alugueis.length;
    const progress = total > 0 ? 100 : 0;
    onUpdate({ rendimentos: { tributaveis, isentos, financeiros, alugueis } }, progress);
  }, [tributaveis, isentos, financeiros, alugueis]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Rendimentos</h3>
        <p className="text-sm text-muted-foreground mt-1">Informe todos os seus rendimentos do ano</p>
      </div>

      <Tabs defaultValue="tributaveis">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tributaveis" className="text-xs">Tributáveis</TabsTrigger>
          <TabsTrigger value="isentos" className="text-xs">Isentos</TabsTrigger>
          <TabsTrigger value="financeiros" className="text-xs">Financeiros</TabsTrigger>
          <TabsTrigger value="alugueis" className="text-xs">Aluguéis</TabsTrigger>
        </TabsList>

        <TabsContent value="tributaveis" className="space-y-4 mt-4">
          {tributaveis.map((r, i) => (
            <div key={r.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rendimento {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setTributaveis(prev => prev.filter(x => x.id !== r.id))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Empresa/Fonte *</Label>
                  <Input value={r.empresa} onChange={e => setTributaveis(prev => prev.map(x => x.id === r.id ? { ...x, empresa: e.target.value } : x))} />
                </div>
                <div className="space-y-1.5">
                  <Label>CNPJ *</Label>
                  <Input value={r.cnpj} onChange={e => setTributaveis(prev => prev.map(x => x.id === r.id ? { ...x, cnpj: e.target.value } : x))} placeholder="00.000.000/0000-00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor Total (R$) *</Label>
                  <Input type="number" step="0.01" value={r.valor_total || ''} onChange={e => setTributaveis(prev => prev.map(x => x.id === r.id ? { ...x, valor_total: Number(e.target.value) } : x))} />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setTributaveis(prev => [...prev, { id: crypto.randomUUID(), empresa: '', cnpj: '', valor_total: 0 }])}>
            <Plus className="h-4 w-4" /> Adicionar Rendimento Tributável
          </Button>
        </TabsContent>

        <TabsContent value="isentos" className="space-y-4 mt-4">
          {isentos.map((r, i) => (
            <div key={r.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rendimento Isento {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setIsentos(prev => prev.filter(x => x.id !== r.id))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo *</Label>
                  <Input value={r.tipo} onChange={e => setIsentos(prev => prev.map(x => x.id === r.id ? { ...x, tipo: e.target.value } : x))} placeholder="Ex: FGTS, Poupança, Dividendos" />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" value={r.valor || ''} onChange={e => setIsentos(prev => prev.map(x => x.id === r.id ? { ...x, valor: Number(e.target.value) } : x))} />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setIsentos(prev => [...prev, { id: crypto.randomUUID(), tipo: '', valor: 0 }])}>
            <Plus className="h-4 w-4" /> Adicionar Rendimento Isento
          </Button>
        </TabsContent>

        <TabsContent value="financeiros" className="space-y-4 mt-4">
          {financeiros.map((r, i) => (
            <div key={r.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rendimento Financeiro {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setFinanceiros(prev => prev.filter(x => x.id !== r.id))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Instituição *</Label>
                  <Input value={r.instituicao} onChange={e => setFinanceiros(prev => prev.map(x => x.id === r.id ? { ...x, instituicao: e.target.value } : x))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo *</Label>
                  <Input value={r.tipo} onChange={e => setFinanceiros(prev => prev.map(x => x.id === r.id ? { ...x, tipo: e.target.value } : x))} placeholder="CDB, LCI, Tesouro..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" value={r.valor || ''} onChange={e => setFinanceiros(prev => prev.map(x => x.id === r.id ? { ...x, valor: Number(e.target.value) } : x))} />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setFinanceiros(prev => [...prev, { id: crypto.randomUUID(), instituicao: '', tipo: '', valor: 0 }])}>
            <Plus className="h-4 w-4" /> Adicionar Rendimento Financeiro
          </Button>
        </TabsContent>

        <TabsContent value="alugueis" className="space-y-4 mt-4">
          {alugueis.map((r, i) => (
            <div key={r.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Aluguel {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setAlugueis(prev => prev.filter(x => x.id !== r.id))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Endereço do Imóvel *</Label>
                  <Input value={r.endereco} onChange={e => setAlugueis(prev => prev.map(x => x.id === r.id ? { ...x, endereco: e.target.value } : x))} />
                </div>
                <div className="space-y-1.5">
                  <Label>CPF do Locatário *</Label>
                  <Input value={r.locatario_cpf} onChange={e => setAlugueis(prev => prev.map(x => x.id === r.id ? { ...x, locatario_cpf: e.target.value } : x))} placeholder="000.000.000-00" />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor Mensal (R$) *</Label>
                  <Input type="number" step="0.01" value={r.valor_mensal || ''} onChange={e => setAlugueis(prev => prev.map(x => x.id === r.id ? { ...x, valor_mensal: Number(e.target.value) } : x))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Meses Recebidos *</Label>
                  <Input type="number" min="1" max="12" value={r.meses_recebidos || ''} onChange={e => setAlugueis(prev => prev.map(x => x.id === r.id ? { ...x, meses_recebidos: Number(e.target.value) } : x))} />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setAlugueis(prev => [...prev, { id: crypto.randomUUID(), endereco: '', locatario_cpf: '', valor_mensal: 0, meses_recebidos: 12 }])}>
            <Plus className="h-4 w-4" /> Adicionar Aluguel Recebido
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
