import { useEffect, useState, useRef } from 'react';

interface MetricCounterProps {
  end: string;
  label: string;
  suffix?: string;
}

export default function MetricCounter({ end, label, suffix = '' }: MetricCounterProps) {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const numericEnd = parseInt(end.replace(/\D/g, ''));
          if (isNaN(numericEnd)) {
            setDisplay(end);
            return;
          }
          const duration = 1500;
          const steps = 40;
          const stepTime = duration / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += numericEnd / steps;
            if (current >= numericEnd) {
              setDisplay(end);
              clearInterval(timer);
            } else {
              setDisplay(Math.floor(current).toString());
            }
          }, stepTime);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-4xl sm:text-5xl font-extrabold text-primary-foreground">
        {display}{suffix}
      </p>
      <p className="mt-2 text-sm text-primary-foreground/70">{label}</p>
    </div>
  );
}
