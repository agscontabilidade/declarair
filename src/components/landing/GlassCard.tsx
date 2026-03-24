import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
}

export default function GlassCard({ children, className, strong }: GlassCardProps) {
  return (
    <div className={cn(
      strong ? 'glass-card-strong' : 'glass-card',
      'rounded-2xl',
      className
    )}>
      {children}
    </div>
  );
}
