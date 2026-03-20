import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { KanbanBoard } from '@/components/dashboard/KanbanBoard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

const years = [2023, 2024, 2025, 2026];

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [anoBase, setAnoBase] = useState(currentYear);
  const { kpis, declaracoes } = useDashboardData(anoBase);
  const { profile, signOut } = useAuth();

  const initials = profile.nome?.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? '?';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-3">
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
    </DashboardLayout>
  );
}
