## Ajuste: UsageBanner aparece só quando próximo do limite (estilo alerta laranja)

Arquivo único: `src/components/billing/UsageBanner.tsx`.

### Regra de exibição

- **Pro**: só renderiza quando `extras <= 2` (faltando 2 ou menos declarações para acabar). Caso contrário, retorna `null` — libera espaço no dashboard.
- **Free**: só renderiza quando `usadas >= limite - 0` (ou seja, no limite — como o Free tem 1 declaração, aparece apenas quando atingiu/estourou). Caso ainda não tenha usado, não aparece.
- Mantém `if (loading) return null`.

### Estilo de alerta (laranja — padrão warning da plataforma)

Quando o card aparecer, usar o mesmo tom dos avisos do sistema (igual ao badge `warning` / `bg-warning/10` já presente no Kanban "Aguardando Documentação"):

- Card: `border-warning/40 bg-warning/10`
- Ícone (`TrendingUp` no Pro / `FileText` no Free): `text-warning`
- Título: mantém `font-medium text-sm`
- Subtítulo no Pro: trocar texto para reforçar urgência, ex.: "Faltam {extras} declaração(ões) — adicione mais para não interromper o atendimento."
- Botão "Comprar Mais" (Pro): trocar `variant="outline"` por `variant="default"` para destacar a ação.
- No Free no limite: mantém alerta destrutivo atual (`border-destructive/50 bg-destructive/5`) — já é o tratamento correto para bloqueio. Apenas reforça que só aparece quando atingido.

### Resumo do comportamento

| Plano | Condição | Resultado |
|---|---|---|
| Free | `usadas < limite` | Não exibe |
| Free | `usadas >= limite` | Card vermelho (atual) |
| Pro | `extras > 2` | Não exibe |
| Pro | `extras <= 2` e `extras > 0` | Card laranja com "Faltam X" + botão "Comprar Mais" destacado |
| Pro | `extras <= 0` | Card laranja com mensagem "Limite atingido — compre mais para continuar" + botão |

Nenhuma mudança em hook, rotas, ou outros arquivos.