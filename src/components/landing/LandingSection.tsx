import { useScrollReveal } from '@/hooks/useScrollReveal';

export function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useScrollReveal();
  return (
    <section ref={ref} id={id} className={`scroll-reveal ${className}`}>
      {children}
    </section>
  );
}
