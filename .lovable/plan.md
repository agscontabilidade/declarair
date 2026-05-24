## Problema confirmado

O backend ainda está retornando `requires_manual_review` porque a função `processar-pdf-declaracao` classifica o PDF como `scan_sem_texto`.

Pelo request real do preview:

```text
arquivo: ANDREA R A K MACHADO - DECLARAÇÃO IR 2026.pdf
motivo: PDF parece escaneado/imagem (sem texto pesquisável)
```

E pelos logs da função:

```text
[pipeline] unpdf insuficiente (len=0, markers=false); tentando pdfjs…
[pipeline] declaracao falhou: scan_sem_texto
```

Ou seja: o problema não é a regra fiscal nem o modal. O problema está antes: os dois extratores atuais (`unpdf.extractText` e `page.getTextContent`) estão retornando texto vazio para esse PDF específico. Enquanto o texto for zero, qualquer parser posterior nunca roda.

## Plano de correção brutal, sem IA

### 1. Trocar a base de extração por um extrator multi-engine

No `supabase/functions/processar-pdf-declaracao/extract-native.ts`, transformar a camada de texto em uma cadeia real de fallback:

```text
A. unpdf.extractText
B. PDFDocumentProxy.getTextContent com layout por coordenada
C. pdfjs-serverless/getDocument direto, com opções para fontes/CMaps
D. extração bruta dos streams internos do PDF
E. parser fiscal por tokens/bytes quando texto visual não vem por PDF.js
```

A camada C é necessária porque há casos em que o wrapper `unpdf` mantém o documento aberto, mas não resolve corretamente fontes/ToUnicode. Usaremos `pdfjs-serverless` diretamente no Edge Function, sem API externa e sem IA.

### 2. Implementar extração bruta de streams PDF

Quando PDF.js retornar `textLen=0`, não concluir imediatamente `scan_sem_texto`.

Adicionar um extrator determinístico que lê o conteúdo bruto do PDF:

- localizar objetos `stream/endstream`;
- tentar descompressão Flate/zlib quando aplicável;
- procurar operadores textuais PDF (`BT`, `ET`, `Tj`, `TJ`, `'`, `"`);
- decodificar strings literais `(...)` e hex strings `<...>`;
- aplicar heurísticas de UTF-16BE, WinAnsi, MacRoman e Latin-1;
- montar um texto aproximado mesmo quando `getTextContent()` falha.

Isso é essencial para PDFs gerados por sistemas oficiais com fontes embarcadas ou mapas ToUnicode ruins.

### 3. Adicionar parser específico para declarações Receita/PGD com texto fragmentado

Ajustar os detectores para aceitar texto fragmentado, sem depender de frase perfeita:

- `DECLARAÇÃO DE AJUSTE ANUAL`;
- `DECLARAÇÃO DE SAÍDA DEFINITIVA DO PAÍS`;
- `IMPOSTO SOBRE A RENDA DA PESSOA FÍSICA`;
- `EXERCÍCIO 2026`;
- `ANO-CALENDÁRIO 2025`;
- CPF com pontuação ou CPF separado por espaços;
- nome do contribuinte próximo ao CPF;
- resultado financeiro em bloco de resumo.

Também vou corrigir um detalhe atual: o texto já é normalizado sem acento, mas algumas regex ainda procuram acentos em cima do texto normalizado. Isso pode causar falso negativo mesmo quando o texto vier.

### 4. Resolver resultado financeiro por matriz de evidências

Para declaração normal e saída definitiva, extrair resultado por prioridade:

```text
1. Campo explícito: IMPOSTO A RESTITUIR > 0
2. Campo explícito: SALDO DE IMPOSTO A PAGAR > 0
3. Quotas com valor > 0 => pagamento
4. Campos zerados => nenhum
5. Conflito pagar>0 e restituir>0 => rejeição real, não modal genérico
```

O parser não deve cair no modal se CPF e ano baterem e só o valor financeiro estiver difícil. Nesse caso, registra a declaração como válida e usa `tipo_resultado: nenhum` somente se os campos indicarem zero ou se o resultado não existir no subtipo.

### 5. Melhorar a decisão `scan_sem_texto`

Hoje a função decide `scan_sem_texto` com `textLen < 80` depois de apenas duas tentativas.

Depois da correção, `scan_sem_texto` só será retornado se TODAS as camadas falharem:

```text
unpdf = vazio
pdfjs proxy = vazio
pdfjs-serverless direto = vazio
raw stream parser = vazio
metadata/fingerprint insuficiente
```

E mesmo assim, a resposta terá diagnóstico mais preciso:

- `scan_sem_texto_real` para PDF imagem de verdade;
- `texto_pdf_inacessivel` para PDF com texto visual mas sem mapa extraível;
- `documento_nao_reconhecido` para arquivo que não é declaração/recibo/DARF/MEI.

### 6. Instrumentar logs técnicos úteis

Adicionar logs sem dados sensíveis completos:

```text
[pipeline/text] engine=unpdf len=0 markers=false
[pipeline/text] engine=pdfjs-proxy len=0 items=0 pages=...
[pipeline/text] engine=pdfjs-direct len=...
[pipeline/text] engine=raw-stream len=...
[pipeline/parse] tipo=declaracao cpf_match=true ano=2026 subtipo=...
```

Isso permite diagnosticar o próximo PDF sem depender de tentativa cega.

### 7. Corrigir comentário/legado de IA no `index.ts`

O `index.ts` ainda tem comentário e variável `LOVABLE_API_KEY` herdados do fluxo antigo. Vou remover isso para deixar claro que o processamento é 100% determinístico e não tenta IA.

### 8. Validar com a requisição real

Depois de implementar, vou testar a função com o mesmo `storage_path` capturado no preview:

```text
191e3bd0-2a37-4eb6-86d7-70f2f7f0bda0/declaracoes/b132e72c-9e57-4843-9aca-461d05847e94/declaracao-1779649624980-ANDREA_R_A_K_MACHADO_-_DECLARA__O_IR_2026.pdf
```

Critério de aceite:

```json
{
  "ok": true,
  "tipo": "declaracao",
  "metodo_validacao": "regex",
  "extracao": {
    "eh_declaracao_irpf": true,
    "cpf": "...",
    "ano_exercicio": 2026,
    "subtipo": "dirpf" ou "saida_definitiva",
    "tipo_resultado": "restituicao" | "pagamento" | "nenhum"
  }
}
```

E o upload não deve abrir o modal.

## Arquivos a alterar

- `supabase/functions/processar-pdf-declaracao/extract-native.ts`
- `supabase/functions/processar-pdf-declaracao/index.ts`

Sem alteração de UI, sem banco, sem RLS, sem schema, sem IA.