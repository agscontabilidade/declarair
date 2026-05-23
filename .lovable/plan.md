
## Escopo

Apenas mudanças visuais (ícones, cores, labels) em `/declaracoes`. Nenhuma alteração de lógica de upload, RLS, envio de e-mail ou banco.

## 1. Coluna "Arquivos" (`AnexarDeclaracaoButton.tsx`)

Hoje o botão mostra apenas dois estados úteis: "Anexar arquivos" (nenhum anexado) ou "Arquivos · N/4" / "Arquivos OK · N/4" (algum anexado / recibo validado), com ícone à esquerda.

Mudanças:
- Considerar apenas **Declaração** e **Recibo** para o estado textual (MEI e DARF continuam no dropdown, mas não entram na contagem do label).
- Remover o ícone da esquerda do botão (`Paperclip`/`FileCheck2`/`Upload`) em todos os estados não-loading. Manter o `ChevronDown` à direita quando o dropdown estiver disponível.
- Remover o sufixo `· N/4` (sem números).
- Novos labels:
  - Nenhum dos dois anexado → **"Anexar Declaração/Recibo"** (variant `outline`)
  - Apenas um dos dois anexado (declaração XOR recibo) → **"Anexado parcial"** (variant `outline`, sem cor verde)
  - Os dois anexados, recibo ainda não validado → **"Declaração/Recibo OK"** (variant `outline` verde suave)
  - Recibo validado (`reciboValidadoEm`) → **"Declaração/Recibo OK"** (variant `default` verde sólido, como hoje quando `transmitida`)
- Loading state inalterado ("Validando...").

## 2. Coluna "Ações" (`Declaracoes.tsx`, desktop e mobile)

Ordem da esquerda para direita continua: ver documentos · observações · enviar e-mail.

### 2a. Ícone "Ver documentos" (atual `FolderOpen`)
- Trocar por `Paperclip` (lucide `Paperclip`).
- Quando houver documentos anexados pelo cliente no drive (qualquer linha em `checklist_documentos` da declaração com `arquivo_url` not null), aplicar contorno + cor verde: `variant="outline"` + classes `border-emerald-300 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50`.
- Quando não houver, manter `variant="ghost"` neutro como hoje.
- Tooltip permanece "Ver documentos".

Para detectar a presença de documentos, adicionar ao `select` da query `declaracoes-lista` o agregado `checklist_documentos(arquivo_url)` e derivar `temDocsDrive = (d.checklist_documentos || []).some(c => !!c.arquivo_url)` no `map`. Sem nova query, sem mudar RLS.

### 2b. Ícone "Observações" (atual `StickyNote`)
- Trocar por `Pin` (alfinete, lucide `Pin`).
- Manter exatamente a mesma lógica: contorno/preenchimento verde quando `temObs`, ghost neutro quando vazio. Mesmo tooltip mostrando o texto da observação.

### 2c. Ícone "Enviar e-mail" (atual `Send`)
- Ícone permanece `Send`.
- E-mail já enviado (`declaracao_enviada_em` truthy): manter ghost com `text-emerald-600 hover:text-emerald-700` (como hoje).
- E-mail não enviado: trocar o atual botão verde sólido por `variant="outline"` com classes `border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700` (sem contorno verde, sem preenchimento sólido).
- Tooltip e ação inalterados.

## 3. Versão mobile (cards `lg:hidden`)

Aplicar as mesmas trocas de ícone/cor para coerência:
- Botão "Documentos" usa `Paperclip` em vez de `FolderOpen`, com cor verde de contorno quando há docs no drive.
- Botão/chip de "Observações" usa `Pin` em vez de `StickyNote`.
- Botão "Enviar"/"Reenviar": "Reenviar" continua ghost verde; "Enviar" passa a `outline` laranja (não mais verde sólido).

## Fora de escopo

- Conteúdo do dropdown de anexar (seções MEI/DARF, validação inteligente) permanece igual.
- `EnviarDeclaracaoEmailModal`, `DocumentosDeclaracaoModal`, `ObservacoesModal` não são alterados.
- Sem mudanças de schema, RLS, edge functions ou nomenclatura no banco.

## Arquivos a editar

- `src/components/declaracoes/AnexarDeclaracaoButton.tsx` — novos labels e remoção do ícone à esquerda.
- `src/pages/Declaracoes.tsx` — query inclui `checklist_documentos(arquivo_url)`; imports `Paperclip`, `Pin`; troca de ícones e classes nas duas views (desktop + mobile).
