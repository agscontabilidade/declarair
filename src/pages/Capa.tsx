import { useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Upload, Phone, Mail, MapPin } from 'lucide-react';
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
      const { data } = await supabase
        .from('escritorios')
        .select('nome, telefone, email, logo_url')
        .eq('id', profile.escritorioId!)
        .single();
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
  const [telefoneEscritorio, setTelefoneEscritorio] = useState('');
  const [emailEscritorio, setEmailEscritorio] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Sync escritorio data
  if (escritorio?.nome && !nomeEscritorio) setNomeEscritorio(escritorio.nome);
  if (escritorio?.telefone && !telefoneEscritorio) setTelefoneEscritorio(escritorio.telefone);
  if (escritorio?.email && !emailEscritorio) setEmailEscritorio(escritorio.email);
  if (escritorio?.logo_url && !logoUrl) setLogoUrl(escritorio.logo_url);

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
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          {/* Form */}
          <Card className="shadow-sm h-fit">
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
                    {[2023, 2024, 2025, 2026].map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Nome do Escritório</Label><Input value={nomeEscritorio} onChange={e => setNomeEscritorio(e.target.value)} /></div>
              <div className="space-y-2"><Label>Nome do Contador(a)</Label><Input value={nomeContador} onChange={e => setNomeContador(e.target.value)} /></div>
              <div className="space-y-2"><Label>Telefone do Escritório</Label><Input value={telefoneEscritorio} onChange={e => setTelefoneEscritorio(e.target.value)} placeholder="(00) 00000-0000" /></div>
              <div className="space-y-2"><Label>Email do Escritório</Label><Input value={emailEscritorio} onChange={e => setEmailEscritorio(e.target.value)} placeholder="contato@escritorio.com" /></div>
              <div className="space-y-2">
                <Label>Logo do Escritório</Label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                <Button variant="outline" className="gap-2 w-full" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> {logoUrl ? 'Trocar imagem' : 'Carregar logo'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <div className="space-y-4">
            <div
              id="capa-preview"
              className="capa-a4 relative overflow-hidden bg-gradient-to-br from-[hsl(213,52%,17%)] via-[hsl(213,52%,24%)] to-[hsl(217,91%,60%)] text-white mx-auto shadow-2xl"
              style={{ aspectRatio: '210/297', maxWidth: 520 }}
            >
              {/* Decorative shapes */}
              <div className="absolute top-8 right-[-40px] w-[200px] h-[200px] rounded-[40px] border-2 border-white/10 rotate-12" />
              <div className="absolute top-[30%] right-[-60px] w-[260px] h-[260px] rounded-[50px] border-2 border-white/8 -rotate-6" />
              <div className="absolute bottom-[-30px] left-[-50px] w-[220px] h-[220px] rounded-[45px] border-2 border-white/10 rotate-45" />
              <div className="absolute bottom-[20%] left-[-30px] w-[160px] h-[160px] rounded-[35px] border border-white/5 rotate-12" />
              <div className="absolute top-[55%] right-[10%] w-[80px] h-[80px] rounded-[20px] border border-white/8 rotate-45" />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full p-8 sm:p-10">
                {/* Logo top-left */}
                <div className="flex items-start">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-14 sm:h-16 w-auto object-contain rounded-lg" />
                  ) : (
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3">
                      <span className="font-display font-bold text-base sm:text-lg">{nomeEscritorio || 'Seu Escritório'}</span>
                    </div>
                  )}
                </div>

                {/* Center content */}
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                  <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-white/60 font-medium">
                    Declaração de
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
                    IMPOSTO DE
                    <br />
                    RENDA
                  </h1>
                  <div className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold text-[hsl(199,89%,70%)] leading-none mt-1">
                    {anoBase}
                  </div>

                  {/* Client name */}
                  <div className="mt-8 w-full max-w-[85%]">
                    <div className="h-px bg-white/20 w-full mb-4" />
                    <p className="text-xl sm:text-2xl font-display font-bold tracking-wide">
                      {nomeCliente || 'Nome do Cliente'}
                    </p>
                    <p className="text-white/50 text-sm mt-1.5 tracking-wider">
                      CPF: {cpfCliente || '000.000.000-00'}
                    </p>
                    <div className="h-px bg-white/20 w-full mt-4" />
                  </div>
                </div>

                {/* Bottom: contador + contact */}
                <div className="space-y-4">
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest">Contador(a) responsável</p>
                    <p className="text-sm font-semibold mt-0.5">{nomeContador || '—'}</p>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-white/50">
                    {telefoneEscritorio && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {telefoneEscritorio}
                      </span>
                    )}
                    {emailEscritorio && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> {emailEscritorio}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
