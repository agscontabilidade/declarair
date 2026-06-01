import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, RotateCcw, Save, Loader2, Mail, MessageCircle } from 'lucide-react';
import {
  useAvisoCobrancaTemplates,
  DEFAULT_AVISO_COBRANCA_WHATSAPP_TEMPLATE,
  DEFAULT_AVISO_COBRANCA_EMAIL_ASSUNTO,
  DEFAULT_AVISO_COBRANCA_EMAIL_CORPO,
} from '@/hooks/useAvisoCobrancaTemplates';
import { usePermissoes } from '@/hooks/usePermissoes';

const PLACEHOLDERS: Array<{ key: string; label: string }> = [
  { key: '{nome}', label: 'Nome do cliente' },
  { key: '{descricao}', label: 'Descrição da cobrança' },
  { key: '{valor}', label: 'Valor (R$)' },
  { key: '{vencimento}', label: 'Data de vencimento' },
  { key: '{dias_atraso}', label: 'Dias em atraso' },
  { key: '{linha_atraso}', label: 'Linha de aviso de atraso (auto)' },
  { key: '{chave_pix}', label: 'Chave Pix do escritório' },
  { key: '{escritorio}', label: 'Nome do escritório' },
  { key: '{mensagem_adicional}', label: 'Mensagem digitada no envio' },
];

function renderPreview(tpl: string, defaultTpl: string): string {
  const base = tpl.trim() ? tpl : defaultTpl;
  return base
    .split('{nome}').join('João Silva')
    .split('{descricao}').join('Honorários — Declaração IRPF 2026')
    .split('{valor}').join('350,00')
    .split('{vencimento}').join('15/04/2026')
    .split('{dias_atraso}').join('5')
    .split('{linha_atraso}').join('⏰ *Em atraso há 5 dia(s).*')
    .split('{chave_pix}').join('contato@contabilidadeabc.com.br')
    .split('{escritorio}').join('AGSCONT')
    .split('{mensagem_adicional}').join('Por favor, regularize assim que possível.');
}

export function AvisoCobrancaTemplateTab() {
  const { templates, loading, salvar } = useAvisoCobrancaTemplates();
  const { isDono } = usePermissoes();

  const [wa, setWa] = useState('');
  const [emailAssunto, setEmailAssunto] = useState('');
  const [emailCorpo, setEmailCorpo] = useState('');

  const waRef = useRef<HTMLTextAreaElement>(null);
  const corpoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setWa(templates.whatsapp ?? '');
    setEmailAssunto(templates.emailAssunto ?? '');
    setEmailCorpo(templates.emailCorpo ?? '');
  }, [templates.whatsapp, templates.emailAssunto, templates.emailCorpo]);

  const insertIn = (
    ref: React.RefObject<HTMLTextAreaElement>,
    value: string,
    setValue: (v: string) => void,
    key: string
  ) => {
    const el = ref.current;
    if (!el) {
      setValue(value + key);
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

  const handleSalvarWa = () => salvar.mutate({ whatsapp: wa });
  const handleSalvarEmail = () => salvar.mutate({ emailAssunto, emailCorpo });

  const placeholderRow = (
    onClick: (key: string) => void,
  ) => (
    <div className="flex flex-wrap gap-2">
      {PLACEHOLDERS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onClick(p.key)}
          disabled={!isDono}
          title={`Inserir ${p.key}`}
        >
          <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">
            <code className="font-mono text-xs">{p.key}</code>
            <span className="ml-2 text-xs text-muted-foreground">{p.label}</span>
          </Badge>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">
          Avisos de cobrança
        </h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Personalize o texto enviado quando você dispara um aviso de cobrança (pendente
          ou atrasada) pelo botão de aviso em <strong>Cobranças</strong>. Se deixar em
          branco, usamos os textos padrão.
        </p>
      </div>

      {!isDono && (
        <Alert>
          <AlertDescription className="text-sm">
            Apenas o Responsável Técnico do escritório pode editar estes templates.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="whatsapp" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" /> Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="mb-2 block">Variáveis disponíveis</Label>
                {placeholderRow((k) => insertIn(waRef, wa, setWa, k))}
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" /> Clique em uma variável para inserir na posição do cursor.
                </p>
              </div>
              <div>
                <Label htmlFor="wa-tpl">Mensagem WhatsApp</Label>
                <Textarea
                  id="wa-tpl"
                  ref={waRef}
                  rows={10}
                  value={wa}
                  onChange={(e) => setWa(e.target.value)}
                  placeholder={DEFAULT_AVISO_COBRANCA_WHATSAPP_TEMPLATE}
                  disabled={!isDono || loading}
                  className="font-mono text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use *texto* para negrito no WhatsApp.
                </p>
              </div>
              <div>
                <Label className="mb-2 block">Pré-visualização</Label>
                <div className="rounded-md border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-sans">
                  {renderPreview(wa, DEFAULT_AVISO_COBRANCA_WHATSAPP_TEMPLATE)}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setWa(DEFAULT_AVISO_COBRANCA_WHATSAPP_TEMPLATE)} disabled={!isDono || loading}>
                  <RotateCcw className="h-4 w-4 mr-2" /> Restaurar padrão
                </Button>
                <Button onClick={handleSalvarWa} disabled={!isDono || loading || salvar.isPending}>
                  {salvar.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <Card className="shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="mb-2 block">Variáveis disponíveis</Label>
                {placeholderRow((k) => insertIn(corpoRef, emailCorpo, setEmailCorpo, k))}
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Info className="h-3 w-3" /> As mesmas variáveis funcionam no assunto e no corpo do email.
                </p>
              </div>

              <div>
                <Label htmlFor="email-assunto">Assunto</Label>
                <Input
                  id="email-assunto"
                  value={emailAssunto}
                  onChange={(e) => setEmailAssunto(e.target.value)}
                  placeholder={DEFAULT_AVISO_COBRANCA_EMAIL_ASSUNTO}
                  disabled={!isDono || loading}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="email-corpo">Corpo do email</Label>
                <Textarea
                  id="email-corpo"
                  ref={corpoRef}
                  rows={10}
                  value={emailCorpo}
                  onChange={(e) => setEmailCorpo(e.target.value)}
                  placeholder={DEFAULT_AVISO_COBRANCA_EMAIL_CORPO}
                  disabled={!isDono || loading}
                  className="font-mono text-sm"
                />
              </div>

              <div>
                <Label className="mb-2 block">Pré-visualização do corpo</Label>
                <div className="rounded-md border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-sans">
                  {renderPreview(emailCorpo, DEFAULT_AVISO_COBRANCA_EMAIL_CORPO)}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailAssunto(DEFAULT_AVISO_COBRANCA_EMAIL_ASSUNTO);
                    setEmailCorpo(DEFAULT_AVISO_COBRANCA_EMAIL_CORPO);
                  }}
                  disabled={!isDono || loading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" /> Restaurar padrão
                </Button>
                <Button onClick={handleSalvarEmail} disabled={!isDono || loading || salvar.isPending}>
                  {salvar.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
