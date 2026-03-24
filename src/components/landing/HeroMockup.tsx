import { BarChart3, Users, FileText, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import heroPerson from '@/assets/hero-person.jpg';

export default function HeroMockup() {
  return (
    <div className="relative w-full h-[500px] lg:h-[560px]">
      {/* Person as the MAIN element — large, prominent */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <img
          src={heroPerson}
          alt="Contador usando notebook"
          className="w-full h-full object-cover object-top"
          width={960}
          height={640}
        />
        {/* Subtle gradient only at bottom for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 to-transparent" />
      </div>

      {/* Small floating KPI card — top right */}
      <div className="absolute top-6 right-4 lg:right-6 glass-card-strong rounded-xl mockup-shadow animate-float px-3 py-2.5 z-10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-success/15 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-xs">+34%</p>
            <p className="text-[8px] text-muted-foreground">produtividade</p>
          </div>
        </div>
      </div>

      {/* Small floating status card — bottom left */}
      <div className="absolute bottom-10 left-4 lg:left-6 glass-card-strong rounded-xl mockup-shadow animate-float-delayed px-3 py-2.5 z-10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center">
            <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-xs">189</p>
            <p className="text-[8px] text-muted-foreground">transmitidas</p>
          </div>
        </div>
      </div>

      {/* Small floating time card — bottom right */}
      <div className="absolute bottom-28 right-4 lg:right-8 glass-card-strong rounded-xl mockup-shadow animate-float-slow px-3 py-2.5 z-10">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-warning/15 flex items-center justify-center">
            <Clock className="h-3.5 w-3.5 text-warning" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-xs">-85%</p>
            <p className="text-[8px] text-muted-foreground">tempo de coleta</p>
          </div>
        </div>
      </div>
    </div>
  );
}
