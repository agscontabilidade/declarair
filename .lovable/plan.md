# Plano: Redesign do modal Enviar Declaração por E-mail

Arquivo único: `src/components/declaracoes/EnviarDeclaracaoEmailModal.tsx`. Sem mudar lógica, payloads, edge function ou queries.

## Layout

- Largura: `max-w-2xl` (era `max-w-md`) com `sm:max-w-2xl`, `p-0` no `DialogContent` para controlar paddings internos por seção. `max-h-[90vh]` e corpo com `overflow-y-auto`.
- Estrutura em 3 blocos visuais com separadores sutis (`border-b border-border/60`): **Header**, **Corpo (mensagem + CC + anexos)**, **Footer fixo**.

## Header (novo)

- Faixa com leve gradiente `bg-gradient-to-br from-primary/5 via-background to-background`, padding `px-6 py-5`.
- Ícone num "tile" arredondado: `h-10 w-10 rounded-xl bg-primary/10 text-primary` com `Mail`.
- Título `text-lg font-semibold` (Bricolage via classe existente) + subtítulo em `text-sm text-muted-foreground` mostrando "Para" como pill: `<span class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">{clienteEmail}</span>`.
- Linha auxiliar com `Badge` cinza: "IRPF {anoBase}" e, quando houver `cobrancaValor`, outra `Badge` em emerald: "Valor: R$ X".

## Corpo

Padding `px-6 py-5 space-y-6`.

### Mensagem do e-mail
- Label com contador de caracteres à direita (`{mensagem.length} caracteres`).
- Textarea: `min-h-[180px]`, `rounded-xl`, `border-border/70`, `focus-visible:ring-2 focus-visible:ring-primary/30`, `leading-relaxed`, `text-[13.5px]`.
- Linha inferior reorganizada: à esquerda chip discreto com `Sparkles`/`History` indicando "Última mensagem carregada" (quando aplicável), à direita botão **Restaurar padrão** como `Button variant="ghost" size="sm"` com ícone `RotateCcw`.

### Cópia (CC)
- Layout em card sutil `rounded-xl border border-dashed border-border/70 p-4`.
- Label inline com ícone `Users` + texto "Enviar cópia para" + chip `(opcional)`.
- Input `rounded-lg`. Hint mais discreto em `text-[11px]`.
- Renderizar chips dos e-mails válidos detectados em tempo real (debounce simples ao digitar via `parseEmails(emailsCopia)`) — apenas visual, não muda envio.

### Documentos inclusos
- Trocar lista vertical por **grid responsivo** `grid grid-cols-1 sm:grid-cols-2 gap-2.5`.
- Cada card: `flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 hover:border-primary/40 transition-colors`.
  - Ícone num quadrado colorido por tipo:
    - Declaração: `bg-primary/10 text-primary` + `FileText`
    - Recibo: `bg-emerald-500/10 text-emerald-600` + `Receipt`
    - DARF: `bg-amber-500/10 text-amber-600` + `FileText`
    - MEI: `bg-blue-500/10 text-blue-600` + `FileText`
  - Coluna direita com nome (truncate, `text-sm font-medium`) e linha menor `text-[11px] text-muted-foreground` com o "tipo" (Declaração / Recibo / DARF / MEI).
- Acima do grid, um título discreto `text-xs font-semibold uppercase tracking-wide text-muted-foreground` + contador "({n} anexos)".

## Footer

- Sticky no fundo: `border-t bg-background/95 backdrop-blur px-6 py-4 flex items-center justify-between gap-3`.
- Esquerda: micro-texto `text-[11px] text-muted-foreground` "Envio assíncrono — pode levar alguns segundos."
- Direita: `Cancelar` (`variant="outline"`) + **Confirmar e Enviar** com `bg-primary hover:bg-primary/90 shadow-sm` mantendo o `Loader2`/`Mail`.

## Detalhes de polimento

- Substituir `max-w-md` por `sm:max-w-2xl` e remover o padding default do `DialogContent` (`p-0`), aplicando padding por seção para permitir o header gradiente full-bleed.
- Bordas em `rounded-2xl` no modal (já vem do Dialog), garantir `overflow-hidden`.
- Tipografia: títulos com `font-display` (Bricolage), corpo padrão.
- Cores e tokens: usar tokens semânticos (`primary`, `muted`, `border`, `card`, `foreground`) — sem hex direto.
- Acessibilidade preservada: `Label htmlFor`, `aria-label` no botão Restaurar, foco visível mantido.

## Fora do escopo

- Nenhuma mudança em props, contratos, RLS, edge function, payload, validações ou regras de negócio. Apenas reorganização visual e classes Tailwind.
