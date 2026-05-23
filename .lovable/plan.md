
## Problema

Na barra de filtros do dashboard os 3 selos no topo direito (47 cinza, 31 vermelho, 7 amarelo) só mostram número + ícone minúsculo. O contador bate o olho e:

- Não sabe o que cada número significa sem passar o mouse.
- Os círculos vermelho/amarelo parecem "erro/alerta do sistema" (igual ao problema que já resolvemos com o ⚠ do card) e não "declarações paradas há X dias".
- Não dá pra clicar — o filtro de urgência fica num `<Select>` separado embaixo, duplicando função.

## Objetivo

Trocar os 3 selos por **chips de filtro rápido**, autoexplicativos, clicáveis, com rótulo curto + número + cor semântica. O `<Select>` "Urgência" sai (vira redundante).

## Como vai ficar

```text
[ 🔽 Filtro ativo: 47 Total ]   [ 🔴 31  Paradas +7d ]   [ 🟡 7  Atenção 3-7d ]   [ 🟢  Em dia ]
```

- Cada chip é um **toggle** do filtro de urgência (clicou → filtra; clicou de novo → limpa).
- Quando ativo: borda sólida + ring sutil na cor; quando inativo: fundo bem suave (`bg-destructive/10` etc.), sem parecer "alerta gritando".
- Zero quando `stats.urgentes === 0` → chip aparece desabilitado em cinza claro ("Nenhuma parada +7d") em vez de sumir, pra UI não "pular".
- Tooltip mantém a explicação completa em linguagem simples.
- O selo "Total" (47) continua só informativo, sem ação.

## Mudanças de cópia (linguagem simples)

- `47` → **"Total 47"** · tooltip: "Declarações exibidas com os filtros atuais."
- `🔴 31` → **"Paradas +7d · 31"** · tooltip: "31 declarações sem mudança de status há mais de 7 dias. Clique para filtrar."
- `🟡 7` → **"Atenção 3-7d · 7"** · tooltip: "7 declarações sem mudança de status entre 3 e 7 dias. Clique para filtrar."
- Novo `🟢` → **"Em dia"** · tooltip: "Atualizadas nos últimos 3 dias. Clique para filtrar."

## Remoções

- Tira o `<Select>` "Urgência" da linha 137-165 (vira redundante com os chips).
- Mantém `<Select>` de Contador e Status.
- Chip de filtro ativo (na linha de chips embaixo) continua refletindo o estado.

## Arquivos a alterar

- `src/components/dashboard/DashboardFilters.tsx` — substituir os 3 `<Badge>` por 4 chips-botão; remover `<Select>` de urgência; reusar `onUrgenciaChange` que já existe.

## Não muda

- `useDashboardFilters.ts` (lógica de `calcularUrgencia`, stats, filtros) — fica igual.
- `KanbanCard`, `KanbanColumn`, `KpiCards` — não tocar.
- Edge functions, schema, RLS — nada.

## Resultado

O contador bate o olho e vê **rótulo + número + cor**, entende em 1 segundo que são declarações paradas (não erros do sistema), e clica direto pra filtrar — sem precisar abrir tooltip nem o select redundante.
