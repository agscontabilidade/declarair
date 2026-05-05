## Objetivo

Quando o contador subir o PDF da declaração na aba **Análise de Caixa** (`/declaracoes/:id`), validar se o documento pertence ao cliente da declaração. Se o CPF/nome do PDF não bater com o cliente, exibir aviso, **não salvar o arquivo** e **não permitir gerar a análise**.

## Comportamento esperado

1. Usuário seleciona PDF → upload para Storage em path temporário.
2. Edge Function `ia-fiscal` é chamada em modo `validate` → IA extrai CPF + nome do PDF.
3. Compara com `clientes.cpf` e `clientes.nome` da declaração:
   - **Match (CPF igual)**: arquivo é confirmado em `arquivo_analise_caixa_url`, fluxo segue normal.
   - **Mismatch**: arquivo é removido do Storage, toast vermelho com mensagem clara ("Este PDF pertence a CPF X / Nome Y, diferente do cliente desta declaração (CPF/Nome Z). Upload cancelado."), botão de análise permanece desabilitado.
4. Se a IA não conseguir extrair CPF (PDF ilegível / não é declaração IRPF), aviso amarelo: "Não foi possível identificar o CPF no PDF. Verifique se é uma declaração IRPF válida." e o arquivo também não é salvo.

## Mudanças técnicas

### `supabase/functions/ia-fiscal/index.ts`
- Adicionar novo `tipo: "validate_owner"`:
  - Recebe `{ declaracao_id, arquivo_path }` (path temporário ainda não persistido em `declaracoes`).
  - Carrega cliente (cpf, nome) via `declaracao_id`.
  - Monta mensagem multimodal com o PDF (reusa `buildAnaliseCaixaMessage`).
  - Prompt enxuto com `google/gemini-2.5-flash` (rápido/barato): "Extraia CPF (formato 000.000.000-00) e Nome do declarante na primeira página. Responda SOMENTE JSON: `{\"cpf\":\"...\",\"nome\":\"...\"}`. Se não encontrar, retorne null."
  - Resposta JSON (não-stream): `{ ok: boolean, motivo?: 'mismatch'|'unreadable', cpf_pdf, nome_pdf, cpf_esperado, nome_esperado }`.
  - Normaliza CPF removendo máscara antes de comparar.

### `src/components/declaracao/SecaoAnaliseCaixa.tsx`
- Refatorar mutation `upload`:
  1. Subir PDF para path **temporário** `…/_analise_caixa/_pending/${declaracaoId}.pdf`.
  2. Invocar `ia-fiscal` com `tipo: 'validate_owner'` e o path temporário.
  3. Se `ok=true`: mover/copiar para path final, atualizar `arquivo_analise_caixa_url` + `_uploaded_at`, remover temporário, toast verde.
  4. Se `ok=false`:
     - Remover PDF temporário do Storage.
     - Exibir `Alert` destrutivo persistente no card (não só toast efêmero) com CPF/Nome do PDF vs CPF/Nome esperado.
     - Não atualizar `arquivo_analise_caixa_url`.
- Novo state `validationError: { cpf_pdf, nome_pdf } | null` para o Alert.
- Bloquear botão "Executar Análise" enquanto houver `validationError` (já fica bloqueado pois `temPdf=false`).
- Acrescentar nota no header: "Validamos automaticamente o CPF do PDF para evitar análise cruzada entre clientes."

### `src/components/declaracao/AbaDocumentosUnificada.tsx` (verificar)
- Se houver upload de declaração via essa aba também, replicar a mesma validação. (A confirmar lendo o arquivo na implementação.)

## Fluxo visual

```text
[Upload PDF] → [Storage temp] → [ia-fiscal validate_owner]
                                         │
                  ┌──────────────────────┴──────────────────────┐
                  ▼                                              ▼
            ok=true                                         ok=false
        confirma path final                          remove arquivo +
        habilita análise                             Alert vermelho
                                                     (CPF X ≠ CPF Y)
```

## Pontos de atenção

- Comparação por **CPF normalizado** (apenas dígitos) é a fonte de verdade; nome é só informativo (variações de acento/sobrenome são aceitáveis).
- Se `clientes.cpf` estiver vazio no banco, pular validação e logar warning (não bloquear o contador).
- Custo: 1 chamada Flash extra por upload (~baixo). Cacheamos o resultado em memória do request, não persiste.
- Não altera schema do banco.
