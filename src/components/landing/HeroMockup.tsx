import { BarChart3, Users, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import heroPerson from '@/assets/hero-person.jpg';

export default function HeroMockup() {
  return (
    <div className="relative w-full h-[500px] lg:h-[560px]">
      {/* Person background behind mockups */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <img
          src={heroPerson}
          alt="Contador usando notebook"
          className="w-full h-full object-cover object-top"
          width={960}
          height={640}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/50" />
      </div>

      {/* Main dashboard mockup */}
      <div className="absolute top-8 left-0 right-0 lg:left-4 lg:right-auto w-[90%] lg:w-[420px] glass-card-strong rounded-2xl mockup-shadow animate-float p-0 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium ml-2">Dashboard — DeclaraIR</span>
        </div>
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 p-3">
          {[
            { label: 'Total', value: '248', icon: FileText, color: 'text-accent' },
            { label: 'Transmitidas', value: '189', icon: CheckCircle2, color: 'text-success' },
            { label: 'Clientes', value: '142', icon: Users, color: 'text-primary' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-background/80 rounded-lg p-2.5 text-center">
              <kpi.icon className={`h-3.5 w-3.5 mx-auto mb-1 ${kpi.color}`} />
              <p className="font-display font-bold text-foreground text-sm">{kpi.value}</p>
              <p className="text-[9px] text-muted-foreground">{kpi.label}</p>
            </div>
          ))}
        </div>
        {/* Mini chart */}
        <div className="px-3 pb-3">
          <div className="bg-background/80 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-foreground">Declarações por mês</span>
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex items-end gap-1 h-12">
              {[35, 52, 68, 45, 78, 92, 85, 60, 95, 88, 72, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-accent/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Kanban card */}
      <div className="absolute bottom-16 right-0 lg:right-0 w-52 glass-card-strong rounded-xl mockup-shadow animate-float-delayed p-3 z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2 w-2 rounded-full bg-warning" />
          <span className="text-[10px] font-semibold text-foreground">Em andamento</span>
        </div>
        {['João Silva — 2025', 'Maria Santos — 2025'].map((name) => (
          <div key={name} className="bg-background/80 rounded-md p-2 mb-1.5 last:mb-0">
            <p className="text-[9px] font-medium text-foreground truncate">{name}</p>
            <div className="flex gap-1 mt-1">
              <span className="text-[8px] bg-accent/10 text-accent px-1.5 rounded">3/5 docs</span>
            </div>
          </div>
        ))}
      </div>

      {/* Floating metric badge */}
      <div className="absolute top-4 right-4 lg:right-8 glass-card-strong rounded-2xl mockup-shadow animate-float-slow px-4 py-3 z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-sm">+34%</p>
            <p className="text-[9px] text-muted-foreground">produtividade</p>
          </div>
        </div>
      </div>
    </div>
  );
}
