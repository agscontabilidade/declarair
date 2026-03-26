import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { DespesaMedica, PlanoSaude, DespesaEducacao, PrevidenciaPrivada, PensaoPaga } from '@/lib/types/formularioCliente';
import type { WizardStepProps } from '../WizardFormulario';

export default function Step5Despesas({ data, onUpdate }: WizardStepProps) {
  const [medicas, setMedicas] = useState<DespesaMedica[]>(data.despesas?.medicas || []);
  const [planos, setPlanos] = useState<PlanoSaude[]>(data.despesas?.planos_saude || []);
  const [educacao, setEducacao] = useState<DespesaEducacao[]>(data.despesas?.educacao || []);
  const [previdencia, setPrevidencia] = useState<PrevidenciaPrivada[]>(data.despesas?.previdencia_privada || []);
  const [pensao, setPensao] = useState<PensaoPaga[]>(data.despesas?.pensao_paga || []);

  useEffect(() => {
    const total = medicas.length + planos.length + educacao.length + previdencia.length + pensao.length;
    onUpdate({ despesas: { medicas, planos_saude: planos, educacao, previdencia_privada: previdencia, pensao_paga: pensao } }, total > 0 ? 100 : 0);
  }, [medicas, planos, educacao, previdencia, pensao]);

  const ListBlock = <T extends { id: string }>({ items, setItems, label, renderFields }: {
    items: T[]; setItems: React.Dispatch<React.SetStateAction<T[]>>; label: string;
    renderFields: (item: T, update: (field: keyof T, val: any) => void) => React.ReactNode;
    newItem: () => T;
  } & { newItem: () => T }) => (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={item.id} className="p-4 border border-border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label} {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => setItems(prev => prev.filter(x => x.id !== item.id))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
          {renderFields(item, (field, val) => setItems(prev => prev.map(x => x.id === item.id ? { ...x, [field]: val } : x)))}
        </div>
      ))}
      <Button variant="outline" className="w-full gap-2" onClick={() => setItems(prev => [...prev, arguments[0].newItem()])}>
        <Plus className="h-4 w-4" /> Adicionar {label}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Despesas Dedutíveis</h3>
        <p className="text-sm text-muted-foreground mt-1">Informe despesas médicas, educação e previdência</p>
      </div>

      <Tabs defaultValue="medicas">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="medicas" className="text-xs">Saúde</TabsTrigger>
          <TabsTrigger value="planos" className="text-xs">Planos</TabsTrigger>
          <TabsTrigger value="educacao" className="text-xs">Educação</TabsTrigger>
          <TabsTrigger value="previdencia" className="text-xs">Previdência</TabsTrigger>
          <TabsTrigger value="pensao" className="text-xs">Pensão</TabsTrigger>
        </TabsList>

        <TabsContent value="medicas" className="space-y-4 mt-4">
          {medicas.map((d, i) => (
            <div key={d.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Despesa Médica {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setMedicas(prev => prev.filter(x => x.id !== d.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Prestador *</Label><Input value={d.prestador} onChange={e => setMedicas(prev => prev.map(x => x.id === d.id ? { ...x, prestador: e.target.value } : x))} /></div>
                <div className="space-y-1.5"><Label>CPF/CNPJ *</Label><Input value={d.cpf_cnpj} onChange={e => setMedicas(prev => prev.map(x => x.id === d.id ? { ...x, cpf_cnpj: e.target.value } : x))} /></div>
                <div className="space-y-1.5"><Label>Tipo *</Label><Input value={d.tipo} onChange={e => setMedicas(prev => prev.map(x => x.id === d.id ? { ...x, tipo: e.target.value } : x))} placeholder="Consulta, exame, cirurgia..." /></div>
                <div className="space-y-1.5"><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={d.valor || ''} onChange={e => setMedicas(prev => prev.map(x => x.id === d.id ? { ...x, valor: Number(e.target.value) } : x))} /></div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setMedicas(prev => [...prev, { id: crypto.randomUUID(), prestador: '', cpf_cnpj: '', tipo: '', valor: 0 }])}>
            <Plus className="h-4 w-4" /> Adicionar Despesa Médica
          </Button>
        </TabsContent>

        <TabsContent value="planos" className="space-y-4 mt-4">
          {planos.map((p, i) => (
            <div key={p.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plano de Saúde {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setPlanos(prev => prev.filter(x => x.id !== p.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label>Operadora *</Label><Input value={p.operadora} onChange={e => setPlanos(prev => prev.map(x => x.id === p.id ? { ...x, operadora: e.target.value } : x))} /></div>
                <div className="space-y-1.5"><Label>CNPJ *</Label><Input value={p.cnpj} onChange={e => setPlanos(prev => prev.map(x => x.id === p.id ? { ...x, cnpj: e.target.value } : x))} /></div>
                <div className="space-y-1.5"><Label>Valor Total (R$) *</Label><Input type="number" step="0.01" value={p.valor_total || ''} onChange={e => setPlanos(prev => prev.map(x => x.id === p.id ? { ...x, valor_total: Number(e.target.value) } : x))} /></div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setPlanos(prev => [...prev, { id: crypto.randomUUID(), operadora: '', cnpj: '', valor_total: 0 }])}>
            <Plus className="h-4 w-4" /> Adicionar Plano de Saúde
          </Button>
        </TabsContent>

        <TabsContent value="educacao" className="space-y-4 mt-4">
          {educacao.map((ed, i) => (
            <div key={ed.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Despesa Educação {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setEducacao(prev => prev.filter(x => x.id !== ed.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Instituição *</Label><Input value={ed.instituicao} onChange={e => setEducacao(prev => prev.map(x => x.id === ed.id ? { ...x, instituicao: e.target.value } : x))} /></div>
                <div className="space-y-1.5"><Label>CNPJ *</Label><Input value={ed.cnpj} onChange={e => setEducacao(prev => prev.map(x => x.id === ed.id ? { ...x, cnpj: e.target.value } : x))} /></div>
                <div className="space-y-1.5">
                  <Label>Tipo *</Label>
                  <Select value={ed.tipo} onValueChange={v => setEducacao(prev => prev.map(x => x.id === ed.id ? { ...x, tipo: v as any } : x))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fundamental">Fundamental</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="superior">Superior</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={ed.valor || ''} onChange={e => setEducacao(prev => prev.map(x => x.id === ed.id ? { ...x, valor: Number(e.target.value) } : x))} /></div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setEducacao(prev => [...prev, { id: crypto.randomUUID(), instituicao: '', cnpj: '', tipo: 'superior' as const, beneficiario: 'titular', valor: 0 }])}>
            <Plus className="h-4 w-4" /> Adicionar Despesa Educação
          </Button>
          <p className="text-xs text-muted-foreground">Limite: R$ 3.561,50 por pessoa</p>
        </TabsContent>

        <TabsContent value="previdencia" className="space-y-4 mt-4">
          {previdencia.map((p, i) => (
            <div key={p.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Previdência {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setPrevidencia(prev => prev.filter(x => x.id !== p.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Instituição *</Label><Input value={p.instituicao} onChange={e => setPrevidencia(prev => prev.map(x => x.id === p.id ? { ...x, instituicao: e.target.value } : x))} /></div>
                <div className="space-y-1.5"><Label>CNPJ *</Label><Input value={p.cnpj} onChange={e => setPrevidencia(prev => prev.map(x => x.id === p.id ? { ...x, cnpj: e.target.value } : x))} /></div>
                <div className="space-y-1.5">
                  <Label>Tipo *</Label>
                  <Select value={p.tipo} onValueChange={v => setPrevidencia(prev => prev.map(x => x.id === p.id ? { ...x, tipo: v as any } : x))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PGBL">PGBL</SelectItem>
                      <SelectItem value="VGBL">VGBL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Valor Contribuído (R$) *</Label><Input type="number" step="0.01" value={p.valor_contribuido || ''} onChange={e => setPrevidencia(prev => prev.map(x => x.id === p.id ? { ...x, valor_contribuido: Number(e.target.value) } : x))} /></div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setPrevidencia(prev => [...prev, { id: crypto.randomUUID(), instituicao: '', cnpj: '', tipo: 'PGBL' as const, valor_contribuido: 0 }])}>
            <Plus className="h-4 w-4" /> Adicionar Previdência Privada
          </Button>
          <p className="text-xs text-muted-foreground">PGBL: dedutível até 12% da renda bruta. VGBL não é dedutível.</p>
        </TabsContent>

        <TabsContent value="pensao" className="space-y-4 mt-4">
          {pensao.map((p, i) => (
            <div key={p.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pensão {i + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => setPensao(prev => prev.filter(x => x.id !== p.id))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label>Beneficiário *</Label><Input value={p.beneficiario} onChange={e => setPensao(prev => prev.map(x => x.id === p.id ? { ...x, beneficiario: e.target.value } : x))} /></div>
                <div className="space-y-1.5"><Label>CPF *</Label><Input value={p.cpf} onChange={e => setPensao(prev => prev.map(x => x.id === p.id ? { ...x, cpf: e.target.value } : x))} /></div>
                <div className="space-y-1.5"><Label>Valor Total (R$) *</Label><Input type="number" step="0.01" value={p.valor_total || ''} onChange={e => setPensao(prev => prev.map(x => x.id === p.id ? { ...x, valor_total: Number(e.target.value) } : x))} /></div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setPensao(prev => [...prev, { id: crypto.randomUUID(), beneficiario: '', cpf: '', valor_total: 0 }])}>
            <Plus className="h-4 w-4" /> Adicionar Pensão Paga
          </Button>
          <p className="text-xs text-muted-foreground">Apenas pensão judicial ou homologada é dedutível</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
