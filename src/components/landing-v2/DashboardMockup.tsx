import { motion } from 'framer-motion';
import { TrendingUp, Users, Shield, CheckCircle2, FileText, Clock } from 'lucide-react';

const kanbanCols = [
  { label: 'Aguardando Docs', color: '--lv2-amber', count: 8, cards: ['Maria Silva', 'João Costa', 'Ana Beatriz'] },
  { label: 'Docs Recebidos', color: '--lv2-emerald', count: 5, cards: ['Carlos Mendes', 'Lucia Ramos'] },
  { label: 'Pronta', color: '--lv2-emerald', count: 12, cards: ['Roberto Lima', 'Fernanda Dias'] },
  { label: 'Transmitida', color: '--lv2-slate-400', count: 34, cards: ['Pedro Santos'] },
];

export default function DashboardMockup() {
  return (
    <div className="relative w-full">
      {/* Glow behind mockup */}
      <div className="absolute inset-0 bg-[hsl(var(--lv2-emerald)/0.08)] rounded-2xl blur-3xl scale-110" />

      <motion.div
        className="relative border-glow rounded-2xl"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      >
        <div className="rounded-2xl overflow-hidden bg-[hsl(var(--lv2-slate-900))] shadow-2xl shadow-black/50">
          {/* Browser bar */}
          <div className="h-9 flex items-center gap-1.5 px-4 bg-[hsl(var(--lv2-slate-900))] border-b border-white/5">
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--lv2-red)/0.7)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--lv2-amber)/0.7)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--lv2-emerald)/0.7)]" />
            <span className="ml-auto text-[10px] text-white/20 font-mono">declarair.app/dashboard</span>
          </div>

          {/* Dashboard content */}
          <div className="p-4 bg-[hsl(var(--lv2-slate-950))]">
            {/* KPI row */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Total', value: '59', icon: FileText, color: '--lv2-emerald' },
                { label: 'Pendentes', value: '8', icon: Clock, color: '--lv2-amber' },
                { label: 'Prontas', value: '12', icon: CheckCircle2, color: '--lv2-emerald' },
                { label: 'Transmitidas', value: '34', icon: TrendingUp, color: '--lv2-slate-400' },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  className="rounded-lg bg-white/5 border border-white/5 p-2.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <kpi.icon className={`h-3 w-3 text-[hsl(var(${kpi.color}))]`} />
                    <span className="text-[8px] text-white/40 uppercase tracking-wide">{kpi.label}</span>
                  </div>
                  <p className="font-mono text-lg font-bold text-white leading-none">{kpi.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Kanban */}
            <div className="grid grid-cols-4 gap-2">
              {kanbanCols.map((col, ci) => (
                <motion.div
                  key={col.label}
                  className="rounded-lg bg-white/[0.03] border border-white/5 p-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + ci * 0.12, duration: 0.5 }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={`h-1.5 w-1.5 rounded-full bg-[hsl(var(${col.color}))]`} />
                    <span className="text-[7px] text-white/50 font-semibold uppercase tracking-wider">{col.label}</span>
                    <span className="ml-auto text-[8px] font-mono text-white/30">{col.count}</span>
                  </div>
                  <div className="space-y-1.5">
                    {col.cards.map((name, j) => (
                      <motion.div
                        key={name}
                        className="rounded-md bg-white/[0.06] border border-white/5 px-2 py-1.5"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3 + ci * 0.12 + j * 0.08 }}
                      >
                        <p className="text-[8px] text-white/70 font-medium truncate">{name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={`h-1 w-8 rounded-full bg-[hsl(var(${col.color})/0.3)]`} />
                          <span className="text-[6px] text-white/25">2025</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating metric cards */}
      <motion.div
        className="absolute -top-5 -right-3 sm:-right-8 bg-[hsl(var(--lv2-slate-900))] rounded-xl px-5 py-4 shadow-2xl border border-white/10 z-10"
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.6, type: 'spring', stiffness: 200 }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[hsl(var(--lv2-emerald)/0.15)] flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-[hsl(var(--lv2-emerald))]" />
          </div>
          <div>
            <p className="font-mono text-xl font-bold text-white">+34%</p>
            <p className="text-[11px] text-white/40">produtividade</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -bottom-5 left-3 sm:left-8 bg-[hsl(var(--lv2-slate-900))] rounded-xl px-5 py-4 shadow-2xl border border-white/10 z-10"
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.8, duration: 0.6, type: 'spring', stiffness: 200 }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[hsl(var(--lv2-amber)/0.15)] flex items-center justify-center">
            <Users className="h-5 w-5 text-[hsl(var(--lv2-amber))]" />
          </div>
          <div>
            <p className="font-mono text-xl font-bold text-white">500+</p>
            <p className="text-[11px] text-white/40">escritórios</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute top-1/2 -left-3 sm:-left-6 bg-[hsl(var(--lv2-slate-900))] rounded-xl px-5 py-4 shadow-2xl border border-white/10 z-10"
        initial={{ opacity: 0, x: -20, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: 2, duration: 0.6, type: 'spring', stiffness: 200 }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[hsl(var(--lv2-emerald)/0.15)] flex items-center justify-center">
            <Shield className="h-5 w-5 text-[hsl(var(--lv2-emerald))]" />
          </div>
          <div>
            <p className="font-mono text-xl font-bold text-white">LGPD</p>
            <p className="text-[11px] text-white/40">compliance</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
