import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
import { DeclaracoesListView } from '@/components/dashboard/DeclaracoesListView';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useClientes } from '@/hooks/useClientes';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const years = [2023, 2024, 2025, 2026];

const checklistPadrao = [
  { nome_documento: 'Informe de Rendimentos (empresa)', categoria: 'rendimentos', obrigatorio: true },
  { nome_documento: 'Informe de Rendimentos Bancários', categoria: 'rendimentos', obrigatorio: true },
  { nome_documento: 'Informe de Rendimentos de Investimentos', categoria: 'rendimentos', obrigatorio: false },
  { nome_documento: 'Recibos de Despesas Médicas', categoria: 'deducoes', obrigatorio: true },
  { nome_documento: 'Comprovantes de Despesas com Educação', categoria: 'deducoes', obrigatorio: true },
  { nome_documento: 'Comprovante de Previdência Privada (PGBL)', categoria: 'deducoes', obrigatorio: false },
  { nome_documento: 'Escritura/Contrato de Imóveis', categoria: 'bens_direitos', obrigatorio: true },
  { nome_documento: 'CRLV de Veículos', categoria: 'bens_direitos', obrigatorio: true },
  { nome_documento: 'Comprovante de Endereço Atualizado', categoria: 'outros', obrigatorio: true },
  { nome_documento: 'Documento de Identidade (RG/CNH)', categoria: 'outros', obrigatorio: true },
];

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [anoBase, setAnoBase] = useState(currentYear);
  const { kpis, declaracoes } = useDashboardData(anoBase);
  const { profile, signOut } = useAuth();
  const { clientes, contadores } = useClientes();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [novoClienteId, setNovoClienteId] = useState('');
  const [novoAno, setNovoAno] = useState(String(currentYear));
  const [novoContadorId, setNovoContadorId] = useState('');
  const [saving, setSaving] = useState(false);

  const initials = profile.nome?.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?';

  async function handleCriarDeclaracao() {
    if (!novoClienteId || !profile.escritorioId) return;
    setSaving(true);
    try {
      const { data: newDecl, error: declErr } = await supabase
        .from('declaracoes')
        .insert({
          cliente_id: novoClienteId,
          escritorio_id: profile.escritorioId,
          contador_id: novoContadorId || null,
          ano_base: Number(novoAno),
          status: 'aguardando_documentos',
        })
        .select()
        .single();
      if (declErr) throw declErr;

      const items = checklistPadrao.map(item => ({
        ...item,
        declaracao_id: newDecl.id,
      }));
      const { error: checkErr } = await supabase.from('checklist_documentos').insert(items);
      if (checkErr) throw checkErr;

      const { error: formErr } = await supabase.from('formulario_ir').insert({
        declaracao_id: newDecl.id,
        cliente_id: novoClienteId,
        ano_base: Number(novoAno),
        status_preenchimento: 'nao_iniciado',
      });
      if (formErr) throw formErr;

      toast({ title: 'Declaração criada com sucesso!' });
      setShowModal(false);
      setNovoClienteId('');
      setNovoContadorId('');
      queryClient.invalidateQueries({ queryKey: ['dashboard-declaracoes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    } catch (err: any) {
      toast({ title: 'Erro ao criar declaração', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowModal(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Nova Declaração
            </Button>
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 transition-colors ${viewMode === 'kanban' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Visualização Kanban"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('lista')}
                className={`p-2 transition-colors ${viewMode === 'lista' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                title="Visualização Lista"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Select value={String(anoBase)} onValueChange={(v) => setAnoBase(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>Ano {y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={signOut}>Sair</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <KpiCards data={kpis.data} isLoading={kpis.isLoading} />
        <KanbanBoard items={declaracoes.data ?? []} isLoading={declaracoes.isLoading} anoBase={anoBase} />
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Declaração</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={novoClienteId} onValueChange={setNovoClienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ano Base *</Label>
              <Select value={novoAno} onValueChange={setNovoAno}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contador Responsável</Label>
              <Select value={novoContadorId} onValueChange={setNovoContadorId}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  {contadores.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button onClick={handleCriarDeclaracao} disabled={!novoClienteId || saving}>
              {saving ? 'Criando...' : 'Criar Declaração'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
