import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import type { AcoesBolsa, Criptoativo } from '@/lib/types/formularioCliente';
import type { WizardStepProps } from '../WizardFormulario';

export default function Step7Investimentos({ data, onUpdate }: WizardStepProps) {
  const [acoes, setAcoes] = useState<AcoesBolsa[]>(data.investimentos?.acoes_bolsa || []);
  const [cripto, setCripto] = useState<Criptoativo[]>(data.investimentos?.criptoativos || []);

  useEffect(() => {
    const total = acoes.length + cripto.length;
    onUpdate({ investimentos: { acoes_bolsa: acoes, criptoativos: cripto } }, total > 0 ? 100 : 0);
  }, [acoes, cripto]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Investimentos</h3>
        <p className="text-sm text-muted-foreground mt-1">Ações, FIIs, ETFs, criptomoedas</p>
      </div>

      <Tabs defaultValue="acoes">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="acoes">Ações / Bolsa</TabsTrigger>
          <TabsTrigger value="cripto">Criptoativos</TabsTrigger>
        </TabsList>

        <TabsContent value="acoes" className="space-y-4 mt-4">
          {acoes.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma operação em bolsa</p>
            </div>
          )}
          {acoes.map((a, i) => (
            <div key={a.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Corretora {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setAcoes(prev => prev.filter(x => x.id !== a.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Corretora *</Label><Input value={a.corretora} onChange={e => setAcoes(prev => prev.map(x => x.id === a.id ? { ...x, corretora: e.target.value } : x))} /></div>
                <div className="space-y-1.5"><Label>CNPJ *</Label><Input value={a.cnpj} onChange={e => setAcoes(prev => prev.map(x => x.id === a.id ? { ...x, cnpj: e.target.value } : x))} /></div>
                <div className="space-y-1.5"><Label>Movimentação Total (R$)</Label><Input type="number" step="0.01" value={a.movimentacao_total || ''} onChange={e => setAcoes(prev => prev.map(x => x.id === a.id ? { ...x, movimentacao_total: Number(e.target.value) } : x))} /></div>
                <div className="space-y-1.5"><Label>Ganho/Perda (R$)</Label><Input type="number" step="0.01" value={a.ganho_perda || ''} onChange={e => setAcoes(prev => prev.map(x => x.id === a.id ? { ...x, ganho_perda: Number(e.target.value) } : x))} /></div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setAcoes(prev => [...prev, { id: crypto.randomUUID(), corretora: '', cnpj: '', movimentacao_total: 0, ganho_perda: 0 }])}>
            <Plus className="h-4 w-4" /> Adicionar Corretora
          </Button>
        </TabsContent>

        <TabsContent value="cripto" className="space-y-4 mt-4">
          {cripto.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Nenhum criptoativo declarado</p>
            </div>
          )}
          {cripto.map((c, i) => (
            <div key={c.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Criptoativo {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setCripto(prev => prev.filter(x => x.id !== c.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Exchange *</Label><Input value={c.exchange} onChange={e => setCripto(prev => prev.map(x => x.id === c.id ? { ...x, exchange: e.target.value } : x))} placeholder="Binance, Mercado Bitcoin..." /></div>
                <div className="space-y-1.5"><Label>Tipo *</Label><Input value={c.tipo} onChange={e => setCripto(prev => prev.map(x => x.id === c.id ? { ...x, tipo: e.target.value } : x))} placeholder="Bitcoin, Ethereum..." /></div>
                <div className="space-y-1.5"><Label>Movimentação Total (R$)</Label><Input type="number" step="0.01" value={c.movimentacao_total || ''} onChange={e => setCripto(prev => prev.map(x => x.id === c.id ? { ...x, movimentacao_total: Number(e.target.value) } : x))} /></div>
                <div className="space-y-1.5"><Label>Ganho/Perda (R$)</Label><Input type="number" step="0.01" value={c.ganho_perda || ''} onChange={e => setCripto(prev => prev.map(x => x.id === c.id ? { ...x, ganho_perda: Number(e.target.value) } : x))} /></div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setCripto(prev => [...prev, { id: crypto.randomUUID(), exchange: '', tipo: '', movimentacao_total: 0, ganho_perda: 0 }])}>
            <Plus className="h-4 w-4" /> Adicionar Criptoativo
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
