import { CheckCircle2, LucideIcon } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface FeatureShowcaseProps {
  title: string;
  description: string;
  bullets: string[];
  mockup: React.ReactNode;
  reversed?: boolean;
}

export default function FeatureShowcase({ title, description, bullets, mockup, reversed }: FeatureShowcaseProps) {
  const ref = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`scroll-reveal flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}
    >
      {/* Mockup */}
      <div className="flex-1 w-full">{mockup}</div>
      {/* Text */}
      <div className="flex-1 space-y-5">
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
        <ul className="space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <span className="text-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
