## Diagnóstico

Auditei 296 ocorrências de `hover:` em 119 arquivos. Os problemas se repetem em 4 padrões:

1. **Ícone colorido + `variant="ghost"`** → o ícone é `text-emerald-600`/`text-destructive`/`text-amber-600` e o ghost aplica `hover:bg-accent` (verde). Resultado: ícone verde em fundo verde, ícone vermelho em fundo verde, etc. — sem contraste. Acontece em `ClientesTable` ($, WhatsApp, copiar CPF), `KanbanCard`, `DeclaracoesListView`, `DocumentosDeclaracaoModal`, `AnexarDeclaracaoButton`, `EnviarDeclaracaoEmailModal`, `ConfirmarDocumentoManualDialog`, `SecaoAnaliseCaixa`, `SecaoObservacoesCliente`.
2. **Badges com hover só de opacidade** (`hover:bg-primary/80`, `hover:bg-emerald-100`, `hover:bg-amber-600`) → mesma matiz, mais escura, sem mudança real de estado. Em `badge.tsx`, `ClientesTable`, `KanbanCard`, `IntegracoesTab`, `WhatsAppConfigTab`.
3. **Hovers hardcoded** (`hover:bg-emerald-50/100/700`, `hover:text-emerald-700/800`, `hover:bg-orange-50`, `hover:bg-amber-600`) espalhados por feature — não respeitam tema dark e ignoram tokens. ~40 ocorrências.
4. **Combinações conflitantes**: link `text-primary` (verde) recebendo `hover:underline` sobre fundo verde-claro (`bg-emerald-50`), botão `bg-emerald-600` recebendo `hover:bg-emerald-700` (mesma matiz), etc.

## Estratégia: 3 fases

Vou tratar em camadas, do mais geral (primitivos) ao específico (features). Cada fase fica autocontida.

### Fase 1 — Sistema de hover semântico (`src/index.css` + `src/components/ui/`)

Definir 4 tokens utilitários reutilizáveis em `@layer components` que dão contraste por **mudança de superfície + foreground**, não opacidade:

```css
.hover-action      → hover:bg-muted hover:text-foreground          /* ação neutra (editar, ver) */
.hover-action-pos  → hover:bg-emerald-50 hover:text-emerald-700    /* ação positiva ($, salvar) — dark: bg-emerald-950/30 text-emerald-300 */
.hover-action-warn → hover:bg-amber-50 hover:text-amber-700        /* alerta (pendente, atenção) */
.hover-action-neg  → hover:bg-destructive/10 hover:text-destructive /* destrutiva (excluir) */
.hover-action-info → hover:bg-blue-50 hover:text-blue-700          /* informativa (WhatsApp, link) */
```

Cada um vira `@apply` no CSS para ficar consistente em light/dark.

**Primitivos:**
- `button.tsx`: adicionar variantes `iconAction`, `iconDestructive`, `iconPositive`, `iconWarning`, `iconInfo` (extensões do `ghost` size `icon`). Mantém `ghost` puro para texto sem semântica.
- `badge.tsx`: trocar `hover:bg-*/80` por hover que aumenta saturação **e** muda foreground; adicionar variantes `success`, `warning`, `info` para acabar com a sopa de `bg-emerald-100 text-emerald-800 hover:bg-emerald-200` espalhada.

### Fase 2 — Sweep dos componentes de tabela/lista (alta visibilidade)

Aplicar as novas variantes em:
- `src/components/clientes/ClientesTable.tsx` — botões $ (positive), WhatsApp (info), Editar (neutral), Excluir (destructive), copiar CPF (positive), badges "Gerada"/"Ativa" (success), "Detalhes" (warning).
- `src/components/dashboard/KanbanCard.tsx` e `KanbanColumn.tsx` — badges de status, ícone "ver detalhe".
- `src/components/dashboard/DeclaracoesListView.tsx` — colunas de ação.
- `src/components/cobrancas/CobrancasTable.tsx` — pagar (positive), excluir (destructive).
- `src/components/mensagens/TemplateList.tsx` — editar/duplicar/excluir.

### Fase 3 — Modais, configurações e portal do cliente

- `DocumentosDeclaracaoModal`, `AnexarDeclaracaoButton`, `EnviarDeclaracaoEmailModal`, `ConfirmarDocumentoManualDialog` — botões de ação com cor semântica certa.
- `SecaoAnaliseCaixa`, `SecaoObservacoesCliente`, `DeclaracaoDetalhe` — hovers de toggle/expand.
- `configuracoes/IntegracoesTab`, `WhatsAppConfigTab`, `WhitelabelTab` — chips/badges de status (conectado/desconectado/pendente).
- `cliente/ClienteDashboard`, `ClienteDocumentos` — cards de upload e cards de status.
- `BillingBanner`, `ClienteViewModal` — botões de upgrade/fechar.
- `layout/Sidebar`, `layout/AdminLayout` — links de navegação (sidebar é dark, hover precisa ser `bg-white/10` + `text-white`, já está OK em parte, padronizar).

### Regras gerais aplicadas em todas as fases

- **Nunca** hover que é só `bg-{cor}/80` da mesma matiz do estado base.
- **Nunca** ícone colorido (`text-emerald-600`, `text-destructive`) dentro de `variant="ghost"` sem variant semântica — o ghost vira fundo verde e quebra o contraste.
- **Sempre** combinar mudança de **superfície** com mudança de **foreground** em pelo menos 1 nível de luminosidade.
- Remover hardcodes `emerald-XXX`/`amber-XXX`/`orange-XXX` quando houver token equivalente — exceto onde a marca realmente exige (logo, CTA principal).
- Manter `active:scale-[0.97]` que já existe nos buttons (não mexer).

## Fora de escopo

- Lógica, roteamento, dados, RLS, schema.
- Reformular paleta global (`--primary`, etc.) — só hovers.
- Mexer em componentes shadcn que não têm hover problemático (Select, Dialog, Tabs).
- Animações (`transition-*`, `scale`, `translate`) — só cores de hover.

## Entrega

Vou rodar as 3 fases em sequência **na próxima execução** (uma fase = um conjunto de edits). Posso parar para você revisar entre fases, ou seguir direto até o fim — me diga ao aprovar se quer revisar fase 1 antes de seguir.
