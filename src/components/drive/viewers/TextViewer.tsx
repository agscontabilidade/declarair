import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props { url: string }

export function TextViewer({ url }: Props) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setError(null);
    fetch(url)
      .then(r => r.text())
      .then(t => { if (!cancelled) setContent(t.slice(0, 500_000)); })
      .catch(() => { if (!cancelled) setError('Não foi possível carregar o conteúdo do arquivo.'); });
    return () => { cancelled = true; };
  }, [url]);

  if (error) return <p className="text-sm text-destructive p-4">{error}</p>;
  if (content === null) return <div className="p-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-4/6" /></div>;
  return (
    <pre className="w-full h-full overflow-auto bg-muted/40 rounded-md p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-words">
      {content}
    </pre>
  );
}
