
# Plano BRUTAL: validação determinística de documentos fiscais (sem IA)

## Objetivo

Zerar a dependência da IA na validação de Declaração IRPF, Recibo, DASN-SIMEI e DARF. Hoje a regex em `extract-native.ts` cobre só PDFs com texto pesquisável — qualquer scan cai em "revisão manual". Vamos transformar a edge function `processar-pdf-declaracao` em um **pipeline de 6 camadas** que ataca o documento com técnicas independentes, atribui confiança e só pede revisão manual quando TODAS falham.

## Princípio

Para cada documento, rodar várias estratégias em paralelo, cada uma devolvendo `{campos, confianca 0–1, razao}`. Um *scorer* final consolida os resultados. Aceite automático exige confiança ≥ 0.85 + checagens cruzadas (CPF/ano/cliente) compatíveis. Abaixo disso → manual.

## As 6 camadas

```text
PDF bytes
  │
  ├─ 1. Sniff & estrutura (tipo MIME real, nº páginas, tem texto?, tem imagens?, tem fontes?)
  │
  ├─ 2. Extração de texto nativa (unpdf + pdfjs fallback)  ──► regex + parser por coordenadas
  │
  ├─ 3. OCR determinístico (Tesseract WASM em Deno)         ──► regex sobre o texto reconhecido
  │
  ├─ 4. Códigos de barra / QR (DARF tem Code-128 com CPF+valor+venc; recibo da RFB tem hash)
  │
  ├─ 5. Template fingerprint (assinatura visual/textual do PDF gerado pelo PGD/eCAC)
  │
  └─ 6. Validadores de domínio (DV de CPF/CNPJ, DV do número de recibo, código DARF, ano coerente)
        │
        ▼
   Scorer + cross-check com cliente/declaração ──► aceitar | rejeitar | manual
```

## Detalhamento por camada

### 1. Sniff & estrutura
- Validar magic bytes `%PDF-`, versão, número de páginas, presença de `/Font`, `/Image`, `/XObject`.
- Calcular razão `imagem/texto` por página → decide se vale OCR.
- Bloquear arquivos suspeitos (criptografados, > 18MB, > 50 páginas).

### 2. Extração de texto nativa (reforçada)
- Manter `unpdf` como primário; adicionar `pdfjs-dist` como fallback (alguns PDFs do PGD têm streams mal codificados que o unpdf entrega vazios).
- **Extrair com coordenadas** (`getTextContent` do pdfjs): permite ler "Saldo de Imposto a Pagar" como **célula** alinhada com o valor da direita, em vez de regex frágil que pega o número errado.
- Construir um *layout map* (linhas reconstruídas a partir de y±tolerância) e procurar rótulos canônicos:
  - DIRPF: `Saldo de Imposto a Pagar`, `Imposto a Restituir`, `Resumo da Declaração`, `Exercício de YYYY`, `Identificação do Contribuinte`.
  - Recibo: `Recibo de Entrega`, `Número do Recibo`, `Data da Transmissão`, hash SHA na última página.
  - DASN-SIMEI: `DASN-SIMEI`, `Ano-Calendário`, CNPJ formatado.
  - DARF: `0211/4600/6015`, `Valor do Principal`, `Valor Total`, `Período de Apuração`, `Data de Vencimento`.

### 3. OCR determinístico (escaneados)
- Rodar **Tesseract WASM** dentro da edge function (Deno + `npm:tesseract.js`), em português, treinado para dígitos+letras.
- Pré-processo: render do PDF em PNG via `pdfjs` + binarização + deskew (canvas no Deno via `npm:@napi-rs/canvas` ou ImageMagick WASM).
- Roda OCR só nas páginas críticas (1ª de identificação + páginas com palavras-chave detectadas em baixa qualidade).
- Mesmo regex/parser da camada 2 é reaplicado sobre o texto OCR.
- Custo de inicialização: cache do `.traineddata` no `/tmp` da função entre invocações.

### 4. Códigos de barra / QR
- DARF tem **Code-128 (linha digitável de 48 dígitos)** que codifica código de receita, CPF, valor e vencimento — é a fonte de verdade.
- Recibo da DIRPF tem **hash SHA** no rodapé (10 grupos de 4 chars) e às vezes QR de autenticação no eCAC.
- Implementar com `@zxing/library` (TS puro, roda em Deno) sobre as imagens renderizadas pelo pdfjs.
- Quando o barcode bate com os campos textuais → confiança = 1.0, encerra o pipeline.

### 5. Template fingerprint
- PDFs gerados pelo PGD/eCAC têm assinaturas estáveis:
  - String `Creator: Programa Gerador da Declaração - PGD`, `Producer: iText` versão X.
  - Hashes de rodapés/cabeçalhos fixos por exercício (gerar tabela com fingerprints conhecidos por ano).
- Se o fingerprint bate, o parser usa **offsets fixos** (mais barato e mais preciso que regex livre).
- Tabela `fingerprints_documentos_rfb` (constante em código, não no banco) versionada por ano-exercício.

### 6. Validadores de domínio (já parcialmente existem)
- DV de CPF e CNPJ — já temos.
- **DV do número do recibo da RFB**: 12 dígitos + 2 DV (módulo 11) — implementar para rejeitar recibos forjados/digitados errado.
- Tabela branca de códigos DARF para IRPF-PF (`0211`, `4600`, `6015`, `8523` se carnê-leão antigo).
- Coerência temporal: `ano_exercicio === ano_base`, `ano_calendario === ano_base - 1` para MEI, `data_transmissao` entre 01/03 e 31/12 do ano_base, vencimento DARF coerente com período de apuração.
- Cruzar **sempre** CPF do PDF com `clientes.cpf` da declaração; mismatch = rejeição dura.

## Scorer e decisão final

```text
score = w1 * camada_texto + w2 * camada_ocr + w3 * camada_barcode
      + w4 * fingerprint + w5 * dominio
        (pesos: barcode > fingerprint > texto > ocr > dominio_isolado)

decisão:
  score ≥ 0.85 e cross-check OK     → aceitar automático
  0.55 ≤ score < 0.85               → aceitar com flag "revisar"
  score < 0.55 ou cross-check falha → revisão manual (modal já existe)
```

Log estruturado por camada vai para `console.log` (visível em Edge Logs) com `metodo_validacao` salvo em `declaracoes` (`regex` | `ocr` | `barcode` | `fingerprint` | `manual`) — útil pra medir taxa de "queda na manual" e ajustar.

## Mudanças no código

### Backend (`supabase/functions/processar-pdf-declaracao/`)

1. `extract-native.ts` — refatorar em módulos:
   - `pipeline.ts` — orquestrador das 6 camadas + scorer.
   - `layers/structure.ts` — sniff e métricas do PDF.
   - `layers/text.ts` — unpdf + pdfjs com coordenadas (substitui o atual).
   - `layers/ocr.ts` — Tesseract WASM + render via pdfjs.
   - `layers/barcode.ts` — zxing para Code-128/QR.
   - `layers/fingerprint.ts` — assinaturas RFB por ano.
   - `layers/domain.ts` — DVs, whitelists, coerência temporal.
   - `parsers/{dirpf,recibo,dasn,darf}.ts` — parsers por tipo consumindo o layout map.
2. `index.ts` — remover o ramo IA inteiro; substituir por chamada única `await runPipeline(bytes, tipo, anoBase, cliente)`. Manter o ramo `manual_confirmacao` (modal já existe).
3. Apagar dependência de `LOVABLE_API_KEY` desta função (continua existindo em outras).
4. Aumentar timeout/memória do edge runtime se necessário (OCR é pesado).

### Banco

- Coluna nova (opcional, recomendada): `declaracoes.metodo_validacao text` e `declaracoes.confianca_validacao numeric(3,2)` para auditoria. Não é obrigatório pro funcionamento — só telemetria.
- Migration mínima e aditiva (sem quebrar nada existente).

### Frontend

- **Nenhuma mudança de UX**. `AnexarDeclaracaoButton.tsx` e `ConfirmarDocumentoManualDialog.tsx` continuam iguais — a função ainda devolve `ok:true` ou `requires_manual_review:true`. O modal vai aparecer muito menos.

## O que NÃO vou mudar

- Schema das tabelas existentes (só adições opcionais).
- RLS, multi-tenancy, fluxo de status do kanban.
- Modal de confirmação manual.
- Outras edge functions.
- Demais regras (limites de plano, cobranças etc.).

## Riscos e mitigações

- **Tamanho do bundle Deno com Tesseract + pdfjs + zxing**: ~8–12MB. Edge function aguenta; verificar cold start. Mitigação: lazy-import por camada (só carrega OCR se camada 2 falhou).
- **Tempo de execução em scans grandes**: limitar OCR a 3 páginas-chave; usar `Promise.race` com timeout de 25s por camada.
- **Falsos positivos via fingerprint**: exigir SEMPRE cross-check de CPF+ano antes de aceitar.
- **Mudança anual do PGD**: tabela de fingerprints versionada por ano-exercício; adicionar novo fingerprint quando a Receita liberar o programa de 2027.

## Critério de pronto

- 100% dos PDFs nativos do PGD são validados sem IA e sem manual.
- ≥ 90% dos PDFs escaneados legíveis são validados via OCR sem manual.
- DARF com código de barras legível = validação instantânea.
- Função nunca retorna mais "Créditos de IA esgotados" — esse caminho deixa de existir.

