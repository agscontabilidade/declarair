import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users, Scale, Upload, FileText, X } from 'lucide-react';
import { maskCPF } from '@/lib/formatters';
import type { WizardStepProps } from '../WizardFormulario';
import { toast } from 'sonner';

interface DependenteSimples {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  grau_parentesco: string;
  recebe_rendimento: boolean;
  arquivos_rendimento: string[]; // file names
}

interface AlimentandoSimples {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  arquivos: string[];
}

const PARENTESCO = [
  { value: 'filho', label: 'Filho(a)' },
  { value: 'conjuge', label: 'Cônjuge' },
  { value: 'pai', label: 'Pai' },
  { value: 'mae', label: 'Mãe' },
  { value: 'outro', label: 'Outro' },
];

export default function Step2DependentesAlimentandos({ data, onUpdate }: WizardStepProps) {
  const [temDependentes, setTemDependentes] = useState<boolean>(data.dependentes && (data.dependentes as any[]).length > 0 || false);
  const [dependentes, setDependentes] = useState<DependenteSimples[]>((data.dependentes as any) || []);
  const [temAlimentandos, setTemAlimentandos] = useState<boolean>(data.paga_pensao || false);
  const [alimentandos, setAlimentandos] = useState<AlimentandoSimples[]>((data.alimentandos as any) || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ type: 'dep' | 'alim'; id: string } | null>(null);

  useEffect(() => {
    let progress = 100;
    if (temDependentes && dependentes.length === 0) progress = 30;
    else if (temDependentes && !dependentes.every(d => d.nome && d.cpf)) progress = 60;
    if (temAlimentandos && alimentandos.length === 0) progress = Math.min(progress, 30);
    else if (temAlimentandos && !alimentandos.every(a => a.nome && a.cpf)) progress = Math.min(progress, 60);

    onUpdate({
      dependentes: dependentes as any,
      alimentandos: alimentandos as any,
      paga_pensao: temAlimentandos,
    }, progress);
  }, [dependentes, alimentandos, temDependentes, temAlimentandos]);

  const addDependente = () => setDependentes(prev => [...prev, {
    id: crypto.randomUUID(), nome: '', cpf: '', data_nascimento: '', grau_parentesco: 'filho',
    recebe_rendimento: false, arquivos_rendimento: [],
  }]);

  const removeDependente = (id: string) => setDependentes(prev => prev.filter(d => d.id !== id));

  const updateDep = (id: string, field: string, value: any) => {
    setDependentes(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const addAlimentando = () => setAlimentandos(prev => [...prev, {
    id: crypto.randomUUID(), nome: '', cpf: '', data_nascimento: '', arquivos: [],
  }]);

  const removeAlimentando = (id: string) => setAlimentandos(prev => prev.filter(a => a.id !== id));

  const updateAlim = (id: string, field: string, value: any) => {
    setAlimentandos(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !uploadTarget) return;
    const fileNames = Array.from(e.target.files).map(f => f.name);
    
    if (uploadTarget.type === 'dep') {
      setDependentes(prev => prev.map(d => d.id === uploadTarget.id
        ? { ...d, arquivos_rendimento: [...d.arquivos_rendimento, ...fileNames] } : d));
    } else {
      setAlimentandos(prev => prev.map(a => a.id === uploadTarget.id
        ? { ...a, arquivos: [...a.arquivos, ...fileNames] } : a));
    }
    toast.success(`${fileNames.length} arquivo(s) anexado(s)`);
    setUploadTarget(null);
    e.target.value = '';
  };

  const triggerUpload = (type: 'dep' | 'alim', id: string) => {
    setUploadTarget({ type, id });
    fileInputRef.current?.click();
  };

  const removeFile = (type: 'dep' | 'alim', id: string, fileName: string) => {
    if (type === 'dep') {
      setDependentes(prev => prev.map(d => d.id === id
        ? { ...d, arquivos_rendimento: d.arquivos_rendimento.filter(f => f !== fileName) } : d));
    } else {
      setAlimentandos(prev => prev.map(a => a.id === id
        ? { ...a, arquivos: a.arquivos.filter(f => f !== fileName) } : a));
    }
  };

  return (
    <div className="space-y-8">
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileSelect} />

      {/* DEPENDENTES */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Dependentes</h3>
          <p className="text-sm text-muted-foreground mt-1">Informe se possui dependentes para incluir na declaração</p>
        </div>

        <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
          <Switch checked={temDependentes} onCheckedChange={(v) => { setTemDependentes(v); if (!v) setDependentes([]); }} />
          <Label className="cursor-pointer">Possuo dependentes</Label>
        </div>

        {!temDependentes && (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Sem dependentes a declarar</p>
          </div>
        )}

        {temDependentes && (
          <>
            {dependentes.map((dep, i) => (
              <div key={dep.id} className="p-4 border border-border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Dependente {i + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeDependente(dep.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nome Completo *</Label>
                    <Input value={dep.nome} onChange={e => updateDep(dep.id, 'nome', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CPF *</Label>
                    <Input value={dep.cpf} onChange={e => updateDep(dep.id, 'cpf', maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de Nascimento *</Label>
                    <Input type="date" value={dep.data_nascimento} onChange={e => updateDep(dep.id, 'data_nascimento', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Grau de Parentesco *</Label>
                    <Select value={dep.grau_parentesco} onValueChange={v => updateDep(dep.id, 'grau_parentesco', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PARENTESCO.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rendimento do dependente */}
                <div className="border-t border-border pt-3">
                  <div className="flex items-center gap-3 mb-3">
                    <Switch checked={dep.recebe_rendimento} onCheckedChange={v => updateDep(dep.id, 'recebe_rendimento', v)} />
                    <Label className="text-sm cursor-pointer">Este dependente recebe algum rendimento?</Label>
                  </div>
                  {dep.recebe_rendimento && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Anexe os informes de rendimento deste dependente</p>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => triggerUpload('dep', dep.id)}>
                        <Upload className="h-4 w-4" /> Anexar Informe de Rendimento
                      </Button>
                      {dep.arquivos_rendimento.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {dep.arquivos_rendimento.map((f, fi) => (
                            <div key={fi} className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md text-xs">
                              <FileText className="h-3 w-3" />
                              <span className="max-w-[150px] truncate">{f}</span>
                              <button onClick={() => removeFile('dep', dep.id, f)} className="hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addDependente} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Adicionar Dependente
            </Button>
          </>
        )}
      </div>

      {/* ALIMENTANDOS */}
      <div className="space-y-4 border-t border-border pt-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Alimentandos / Pensão Alimentícia</h3>
          <p className="text-sm text-muted-foreground mt-1">Informar caso pague pensão alimentícia judicial</p>
        </div>

        <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
          <Switch checked={temAlimentandos} onCheckedChange={(v) => { setTemAlimentandos(v); if (!v) setAlimentandos([]); }} />
          <Label className="cursor-pointer">Pago pensão alimentícia judicial</Label>
        </div>

        {!temAlimentandos && (
          <div className="text-center py-6 text-muted-foreground">
            <Scale className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Sem pensão alimentícia a declarar</p>
          </div>
        )}

        {temAlimentandos && (
          <>
            {alimentandos.map((al, i) => (
              <div key={al.id} className="p-4 border border-border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Alimentando {i + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeAlimentando(al.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Nome Completo *</Label>
                    <Input value={al.nome} onChange={e => updateAlim(al.id, 'nome', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CPF *</Label>
                    <Input value={al.cpf} onChange={e => updateAlim(al.id, 'cpf', maskCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data de Nascimento</Label>
                    <Input type="date" value={al.data_nascimento} onChange={e => updateAlim(al.id, 'data_nascimento', e.target.value)} />
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Anexe documentos deste alimentando (decisão judicial, comprovantes, etc.)</p>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => triggerUpload('alim', al.id)}>
                    <Upload className="h-4 w-4" /> Anexar Documentos
                  </Button>
                  {al.arquivos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {al.arquivos.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md text-xs">
                          <FileText className="h-3 w-3" />
                          <span className="max-w-[150px] truncate">{f}</span>
                          <button onClick={() => removeFile('alim', al.id, f)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addAlimentando} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Adicionar Alimentando
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
