## Contexto

Na tabela `/declaracoes` (desktop) há duas inconsistências de UX:

1. **Coluna "Anexar"** — o nome sugere apenas "subir arquivo", mas a coluna mostra o estado completo dos arquivos da declaração (PDF da declaração, recibo, MEI, DARF) e pode aparecer como botão verde "Transmitida" quando tudo está validado. "Anexar" subestima o que está ali.
2. **Badge de status "Transmitida"** — hoje é cinza neutro (`bg-gray-100 text-gray-700`). Transmitida é o estado **final de sucesso** do fluxo (aguardando → recebida → pronta → transmitida). Cinza passa sensação de "inativo/cancelado" e conflita visualmente com o botão verde grande "Transmitida" da mesma linha (screenshot do usuário).

## Mudanças

### 1. Renomear coluna "Anexar" → **"Arquivos"**

Mais honesto: a coluna agrupa todos os arquivos da declaração (PDF, recibo, MEI, DARF), não apenas a ação de anexar. "Arquivos" funciona tanto para o estado vazio (botão "Anexar") quanto para o estado completo (chip verde "Transmitida").

Arquivo: `src/pages/Declaracoes.tsx` linha 247.

### 2. Badge "Transmitida" com cor de sucesso suave

Trocar de cinza para verde suave consistente com o sistema (mesma família do `--success`), mas com tom **mais sóbrio que o "Pronta para envio"** para sinalizar "concluído / arquivado" sem competir visualmente com estados ativos do kanban.

Antes:
```ts
transmitida: 'bg-gray-100 text-gray-700',
```

Depois:
```ts
transmitida: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
```

Hierarquia visual proposta na tabela:
- 🟡 Aguardando documentos — âmbar (ativo, requer ação)
- 🔵 Documentação recebida — azul (em progresso)
- 🟢 Pronta para envio — verde forte (pronto p/ ação)
- 🟢 Transmitida — verde suave com borda (concluído, sucesso silencioso)

Arquivo: `src/pages/Declaracoes.tsx` linha 45.

## Não muda

- Schema, RLS, lógica de filtros, kanban do Dashboard (lá `transmitida` já é `bg-muted` e faz sentido pois a coluna inteira é histórica).
- Comportamento de `AnexarDeclaracaoButton`, apenas o cabeçalho da coluna.
- Versão mobile/cards (a coluna "Anexar" só existe no desktop ≥ lg).

## Efeito

- Contador bate o olho e entende que aquela coluna é o **hub de arquivos** da declaração, não só upload.
- "Transmitida" passa a sinalizar visualmente **sucesso/concluído**, alinhado ao botão verde da mesma linha e ao significado real do status.
