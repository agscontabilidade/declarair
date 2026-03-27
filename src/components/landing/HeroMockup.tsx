import mockupDashboard from '@/assets/mockup-dashboard.jpg';
import mockupClients from '@/assets/mockup-clients.jpg';
import mockupPortal from '@/assets/mockup-portal.jpg';

export default function HeroMockup() {
  return (
    <div className="relative w-full flex items-center justify-center py-8 lg:py-12">
      {/* Left card — tilted, behind */}
      <div className="absolute left-0 sm:left-4 lg:left-0 top-8 w-[55%] sm:w-[48%] z-10 -rotate-6 hover:-rotate-3 transition-transform duration-500">
        <div className="rounded-xl overflow-hidden shadow-2xl border border-white/20">
          <div className="bg-foreground/90 h-6 flex items-center gap-1.5 px-3">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/80" />
          </div>
          <img
            src={mockupClients}
            alt="Perfil do cliente"
            className="w-full h-auto object-cover"
            loading="lazy"
            width={1280}
            height={800}
          />
        </div>
      </div>

      {/* Center card — main, on top */}
      <div className="relative z-30 w-[70%] sm:w-[60%] hover:scale-[1.02] transition-transform duration-500">
        <div className="rounded-xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-white/20">
          <div className="bg-foreground/90 h-7 flex items-center gap-1.5 px-3">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/80" />
          </div>
          <img
            src={mockupDashboard}
            alt="Dashboard DeclaraIR"
            className="w-full h-auto object-cover"
            width={1280}
            height={800}
          />
        </div>
        {/* Floating badge */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-card-strong rounded-lg px-4 py-2 mockup-shadow animate-float z-40">
          <p className="font-display font-bold text-foreground text-sm whitespace-nowrap">
            ✨ +34% produtividade
          </p>
        </div>
      </div>

      {/* Right card — tilted, behind */}
      <div className="absolute right-0 sm:right-4 lg:right-0 top-8 w-[55%] sm:w-[48%] z-20 rotate-6 hover:rotate-3 transition-transform duration-500">
        <div className="rounded-xl overflow-hidden shadow-2xl border border-white/20">
          <div className="bg-foreground/90 h-6 flex items-center gap-1.5 px-3">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/80" />
          </div>
          <img
            src={mockupPortal}
            alt="Portal do cliente"
            className="w-full h-auto object-cover"
            loading="lazy"
            width={1280}
            height={800}
          />
        </div>
      </div>
    </div>
  );
}
