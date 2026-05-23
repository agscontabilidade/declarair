## Objetivo

Enriquecer a mensagem padrão do modal "Enviar Declaração por E-mail" com dados contextuais (resultado, valor da cobrança, chave Pix e assinatura) e habilitar **negrito** no e-mail renderizado.

## Arquivos afetados

1. `src/components/declaracoes/EnviarDeclaracaoEmailModal.tsx` (frontend, montagem da mensagem padrão).
2. `supabase/functions/_shared/transactional-email-templates/envio-manual-declaracao.tsx` (renderizar `**negrito**` como `<strong>`).

Nenhuma mudança em props, schema, RLS ou edge function. Sem novas tabelas.

## 1. Dados adicionais buscados no modal

No `useEffect` já existente que abre o modal, ampliar as queries (apenas leitura):

- **Declaração** (`declaracoes`): adicionar `tipo_resultado, valor_resultado` na seleção (já consultada para `ultima_mensagem_email`).
- **Cobrança** (`cobrancas`): além de `valor`, trazer `forma_pagamento` na query existente.
- **Escritório** (`escritorios`): além de `nome`, trazer `chave_pix, chave_pix_tipo`.
- **Contador** (assinatura): usar `profile.nome` do `useAuth()` (já disponível).

Novos states: `resultado: { tipo, valor } | null`, `formaPagamento: string | null`, `chavePix: { tipo, chave } | null`.

## 2. Geração da mensagem padrão

Reescrever o `useEffect` que monta `mensagem` para incluir blocos condicionais. Cada label/valor importante envolvido em `**...**`.

Esqueleto da mensagem final (exemplo com todos os blocos):

```
Prezado(a) {Nome},

Sua Declaração de Imposto de Renda {ano} foi transmitida com sucesso.

Seguem em anexo a cópia da declaração, o respectivo recibo de entrega[, o DARF para pagamento][, a Declaração do MEI (DASN-SIMEI)].

**Resultado da declaração:** **Restituição de R$ 1.234,56**  (ou: **Imposto a pagar de R$ X**, ou: **Sem imposto a pagar nem restituição**)

**Valor da declaração:** **R$ 300,00**

**Chave Pix para pagamento ({tipo}):** **{chave}**

Ficamos à disposição para qualquer dúvida.

Obrigado pela confiança mais um ano.

Atenciosamente,
**{Nome do Contador}**
```

### Regras de inclusão

- **Resultado**: incluir sempre que `tipo_resultado` existir. Mapeamento:
  - `restituicao` → "Restituição de {valorFmt}"
  - `pagamento` / `imposto_a_pagar` → "Imposto a pagar de {valorFmt}"
  - `nenhum` / sem valor → "Sem imposto a pagar nem restituição"
- **Valor da declaração (cobrança)**: incluir quando `cobrancaValor != null` (linha já existente, apenas reformatada com `**`).
- **Chave Pix**: incluir quando `escritorio.chave_pix` existir **e** houver cobrança **e** (`cobranca.forma_pagamento === 'pix'` **ou** `forma_pagamento` for null/ausente — fallback para suportar fluxo atual antes da futura opção no modal de cobrança).
- **Assinatura**: sempre. "Obrigado pela confiança mais um ano." + nova linha + "Atenciosamente," + nova linha + `**{profile.nome ?? nomeEscritorio}**`.

A mensagem padrão continua sendo sobrescrita assim que o usuário edita (flag `mensagemPersonalizada` já existente preservada). "Restaurar padrão" volta a gerar com os novos blocos.

## 3. Renderização de negrito no e-mail

No template `envio-manual-declaracao.tsx`, hoje cada linha vira um `<Text>` simples. Adicionar um util `renderMarkdownBold(line: string): React.ReactNode[]` que faz split em `/\*\*(.+?)\*\*/g` e devolve um array misturando strings cruas e `<strong>{...}</strong>`.

Substituir `{line}` pelo retorno desse util dentro do `lines.map`. Sem dependências novas, sem `dangerouslySetInnerHTML` (continua seguro/escapado pelo React).

Comportamento: usuário pode digitar `**texto**` na textarea do modal e ver em negrito no e-mail final. Mensagens antigas sem `**` continuam funcionando.

## 4. Detalhes de UX no modal

- A textarea continua exibindo `**marcadores**` como texto cru (não interpretamos no preview do modal para manter simplicidade). Pode-se adicionar uma micro-hint no rodapé da textarea: `Use **texto** para destacar trechos em negrito no e-mail.` (`text-[11px] text-muted-foreground`).
- Sem mudanças visuais no header, anexos, CC ou footer do modal.

## Fora do escopo

- Modal de gerar cobrança (escolher Pix) — será feito em tarefa futura, conforme indicado pelo usuário.
- Suporte a outros marcadores markdown (itálico, listas, links). Apenas `**negrito**`.
- Alterações no template de e-mail além do parser de negrito.
- Mudanças em `declaracao`, `cobranca` ou `escritorios` (apenas leitura).
