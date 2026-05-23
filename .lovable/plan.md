## Problema
Na tabela `/declaracoes`, quando uma declaração é transmitida, **duas colunas exibem o mesmo rótulo "Transmitida"**:
- Coluna **Status** — badge do status real da declaração.
- Coluna **Arquivos** — `AnexarDeclaracaoButton` em variante "default" também mostra "Transmitida" (porque hoje o estado do botão é derivado de `reciboValidadoEm`).

Isso é redundante e desperdiça a coluna "Arquivos", que deveria comunicar o estado dos anexos (Declaração, Recibo, MEI, DARF), não o status global.

## Proposta (apenas UI, sem mudar lógica)

Em `src/components/declaracoes/AnexarDeclaracaoButton.tsx`, alterar **somente o rótulo/visual do trigger** do dropdown. A lógica de upload, validação por IA e a regra "recibo validado → transmitida" continuam intactas.

Novo comportamento do botão (estado visual derivado dos mesmos dados já recebidos por props):

1. Calcular contagem de anexos válidos: `anexados = secoes.filter(s => !!s.url).length` (total 4).
2. Substituir o texto fixo "Transmitida" / "Anexar" por um rótulo que descreva os **arquivos**, com 3 estados visuais:
   - **Nenhum anexo** (`anexados === 0`) → `variant="outline"`, ícone `Upload`, texto `Anexar arquivos` + chevron. (igual ao atual)
   - **Parcial** (`0 < anexados < 4`) → `variant="outline"`, ícone `Paperclip`, texto `Arquivos · {anexados}/4` + chevron. Mostra progresso sem prometer conclusão.
   - **Recibo validado** (`transmitida === true`) → `variant="default"` (verde), ícone `FileCheck2`, texto `Arquivos OK · {anexados}/4`. Comunica "anexos completos e validados" sem repetir a palavra "Transmitida".
3. Estado "Validando..." durante upload permanece igual.
4. Importar `Paperclip` de `lucide-react`.

Nenhuma mudança em:
- `src/pages/Declaracoes.tsx` (colunas, ordem, filtros).
- Edge function `processar-pdf-declaracao`.
- Regras de status (`declaracoes.status`), banco ou RLS.
- Dropdown interno (seções por tipo de arquivo continuam idênticas).

## Resultado
A coluna **Status** continua dizendo "Transmitida" (status oficial). A coluna **Arquivos** passa a comunicar o que de fato representa — quantos PDFs estão anexados/validados — eliminando a duplicação visual e dando contexto útil de relance.