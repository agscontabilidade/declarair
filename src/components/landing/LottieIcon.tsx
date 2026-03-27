import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

interface LottieIconProps {
  url: string;
  className?: string;
}

export default function LottieIcon({ url, className = 'h-10 w-10' }: LottieIconProps) {
  const [data, setData] = useState<object | null>(null);

  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch(() => null);
  }, [url]);

  if (!data) return <div className={`${className} bg-muted/30 rounded-full animate-pulse`} />;

  return <Lottie animationData={data} loop className={className} />;
}
