import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Upload, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes } from '@/hooks/useClientes';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCPF } from '@/lib/formatters';

export default function Capa() {
  const { profile } = useAuth();
  const { clientes } = useClientes();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: escritorio } = useQuery({
    queryKey: ['escritorio', profile.escritorioId],
    queryFn: async () => {
      const { data } = await supabase.from('escritorios').select('nome').eq('id', profile.escritorioId!).single();
      return data;
    },
    enabled: !!profile.escritorioId,
  });

  const [clienteId, setClienteId] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [cpfCliente, setCpfCliente] = useState('');
  const [anoBase, setAnoBase] = useState(String(new Date().getFullYear()));
  const [nomeEscritorio, setNomeEscritorio] = useState('');
  const [nomeContador, setNomeContador] = useState(profile.nome || '');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Sync escritorio name
  if (escritorio?.nome && !nomeEscritorio) setNomeEscritorio(escritorio.nome);

  function handleSelectCliente(id: string) {
    setClienteId(id);
    const c = clientes.find(cl => cl.id === id);
    if (c) {
      setNomeCliente(c.nome);
      setCpfCliente(formatCPF(c.cpf));
    }
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setLogoUrl(URL.createObjectURL(file));
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Gerar Capa</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">Dados da Capa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Selecionar Cliente</Label>
                <Select value={clienteId} onValueChange={handleSelectCliente}>
                  <SelectTrigger><SelectValue placeholder="Selecione para auto-preencher" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nome do Cliente</Label><Input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} /></div>
              <div className="space-y-2"><Label>CPF</Label><Input value={cpfCliente} onChange={e => setCpfCliente(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Ano Base</Label>
                <Select value={anoBase} onValueChange={setAnoBase}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nome do Escritório</Label><Input value={nomeEscritorio} onChange={e => setNomeEscritorio(e.target.value)} /></div>
              <div className="space-y-2"><Label>Nome do Contador</Label><Input value={nomeContador} onChange={e => setNomeContador(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Logo do Escritório</Label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> {logoUrl ? 'Trocar imagem' : 'Carregar logo'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="space-y-4">
            <Card className="shadow-sm border-2 border-primary/20 print:border-0 print:shadow-none" id="capa-preview">
              <CardContent className="p-8 flex flex-col items-center text-center min-h-[500px] justify-center gap-6">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-20 w-auto object-contain" />
                ) : (
                  <FileText className="h-16 w-16 text-primary/30" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest">Declaração de Imposto de Renda</p>
                  <p className="text-3xl font-display font-bold text-primary mt-1">IRPF {anoBase}</p>
                </div>
                <div className="border-t border-b border-border py-4 w-full space-y-1">
                  <p className="text-lg font-semibold text-foreground">{nomeCliente || 'Nome do Cliente'}</p>
                  <p className="text-muted-foreground">{cpfCliente || '000.000.000-00'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{nomeEscritorio || 'Nome do Escritório'}</p>
                  <p className="text-sm text-muted-foreground">Contador: {nomeContador || '—'}</p>
                </div>
              </CardContent>
            </Card>
            <Button className="w-full gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimir Capa
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
