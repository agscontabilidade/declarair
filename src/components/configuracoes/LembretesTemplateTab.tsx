import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, RotateCcw, Save, Loader2 } from 'lucide-react';
import { useLembreteTemplate, DEFAULT_LEMBRETE_WHATSAPP_TEMPLATE } from '@/hooks/useLembreteTemplate';
import { usePermissoes } from '@/hooks/usePermissoes';

const PLACEHOLDERS: Array<{ key: string; label: string }> = [
  { key: '{nome}', label: 'Nome do cliente' },
  { key: '{ano_base}', label: 'Ano-base' },
  { key: '{prazo}', label: 'Prazo final' },
  { key: '{escritorio}', label: 'Nome do escritório' },
  { key: '{mensagem_adicional}', label: 'Mensagem adicional (digitada no envio)' },
];

function renderPreview(tpl: string): string {
  const base = tpl.trim() ? tpl : DEFAULT_LEMBRETE_WHATSAPP_TEMPLATE;
  return base
    .split('{nome}').join('João Silva')
    .split('{ano_base}').join('2026')
    .split('{prazo}').join('29/05/2026')
    .split('{escritorio}').join('AGSCONT')
    .split('{mensagem_adicional}').join('Por favor, envie os documentos pendentes assim que possível.');
}

export function LembretesTemplateTab() {
  const { template, loading, salvar } = useLembreteTemplate();
  const { isDono } = usePermissoes();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(template ?? '');
  }, [template]);

  const insertPlaceholder = (key: string) => {
    const el = textareaRef.current;
    if (!el) {
      setValue((v) => v + key);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + key + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + key.length, start + key.length);
    });
  };

  const handleSalvar = () => {
    salvar.mutate(value.trim() ? value : null);
  };

  const handleRestaurar = () => {
    setValue(DEFAULT_LEMBRETE_WHATSAPP_TEMPLATE);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Template do lembrete (WhatsApp)
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Personalize o texto enviado quando você dispara um lembrete de prazo IR pelo
          WhatsApp em <strong>Lembretes</strong>. Se deixar em branco, usamos o texto
          padrão do sistema.
        </p>
      </div>

      {!isDono && (
        <Alert>
          <AlertDescription className="text-sm">
            Apenas o Responsável Técnico do escritório pode editar este template.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="mb-2 block">Variáveis disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => insertPlaceholder(p.key)}
                  disabled={!isDono}
                  className="group"
                  title={`Inserir ${p.key}`}
                >
                  <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">
                    <code className="font-mono text-xs">{p.key}</code>
                    <span className="ml-2 text-xs text-muted-foreground">{p.label}</span>
                  </Badge>
                </button>
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" /> Clique em uma variável para inserir na posição do cursor.
            </p>
          </div>

          <div>
            <Label htmlFor="tpl">Conteúdo da mensagem</Label>
            <Textarea
              id="tpl"
              ref={textareaRef}
              rows={10}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={DEFAULT_LEMBRETE_WHATSAPP_TEMPLATE}
              disabled={!isDono || loading}
              className="font-mono text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use *texto* para negrito no WhatsApp. Quebras de linha são preservadas.
            </p>
          </div>

          <div>
            <Label className="mb-2 block">Pré-visualização</Label>
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-sans">
              {renderPreview(value)}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleRestaurar} disabled={!isDono || loading}>
              <RotateCcw className="h-4 w-4 mr-2" /> Restaurar padrão
            </Button>
            <Button onClick={handleSalvar} disabled={!isDono || loading || salvar.isPending}>
              {salvar.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
