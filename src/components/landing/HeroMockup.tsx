import mockupHero from '@/assets/mockup-dashboard-hero.png';

export default function HeroMockup() {
  return (
    <div className="relative w-full flex items-center justify-center py-4">
      {/* Main mockup */}
      <div className="relative z-10 w-full max-w-[620px] hover:scale-[1.01] transition-transform duration-500">
        <div className="rounded-xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] border border-white/15">
          <div className="bg-foreground/90 h-7 flex items-center gap-1.5 px-3">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/80" />
          </div>
          <img
            src={mockupHero}
            alt="Dashboard DeclaraIR com Kanban e KPIs"
            className="w-full h-auto object-cover"
            width={1480}
            height={800}
          />
        </div>

        {/* Floating badges */}
        <div className="absolute -top-4 -right-4 glass-card-strong rounded-lg px-4 py-2.5 shadow-xl animate-float z-20 border border-accent/20">
          <p className="font-display font-bold text-foreground text-sm whitespace-nowrap flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            12 declarações hoje
          </p>
        </div>

        <div className="absolute -bottom-5 left-4 glass-card-strong rounded-lg px-4 py-2.5 shadow-xl animate-float z-20 border border-success/20" style={{ animationDelay: '1s' }}>
          <p className="font-display font-bold text-foreground text-sm whitespace-nowrap">
            ✨ +34% produtividade
          </p>
        </div>

        <div className="absolute top-1/3 -left-6 glass-card-strong rounded-lg px-3 py-2 shadow-xl animate-float z-20 border border-warning/20" style={{ animationDelay: '2s' }}>
          <p className="font-display font-bold text-sm whitespace-nowrap flex items-center gap-1.5">
            <span className="text-warning">⚡</span>
            <span className="text-foreground">2min setup</span>
          </p>
        </div>

        <div className="absolute bottom-1/4 -right-5 glass-card-strong rounded-lg px-3 py-2 shadow-xl animate-float z-20 border border-accent/20" style={{ animationDelay: '0.5s' }}>
          <p className="font-display font-bold text-sm whitespace-nowrap flex items-center gap-1.5">
            💰 <span className="text-foreground">R$ 0,00</span>
          </p>
        </div>
      </div>
    </div>
  );
}
