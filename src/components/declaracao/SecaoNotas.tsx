import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Check } from 'lucide-react';

interface Props {
  observacoes: string | null;
  onSave: (text: string) => void;
}

export function SecaoNotas({ observacoes, onSave }: Props) {
  const [text, setText] = useState(observacoes || '');
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(observacoes || '');
  }, [observacoes]);

  const debouncedSave = useCallback((value: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 2000);
  }, [onSave]);

  const handleChange = (value: string) => {
    setText(value);
    setSaved(false);
    debouncedSave(value);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Notas Internas</CardTitle>
          {saved && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Check className="h-3 w-3" /> Salvo automaticamente
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={text}
          onChange={e => handleChange(e.target.value)}
          placeholder="Observações internas sobre esta declaração..."
          rows={4}
          className="resize-none"
        />
      </CardContent>
    </Card>
  );
}
