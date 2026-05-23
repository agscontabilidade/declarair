No modal **Editar dados pessoais** (`src/components/declaracao/editar/EditarCadastraisDialogs.tsx`), trocar os dois `<Input>` livres de **Ocupação** e **Natureza ocupação** por **Combobox com busca** usando as mesmas listas oficiais já utilizadas pelo cliente em `StepDadosPessoais.tsx`:

- `OCUPACOES_PRINCIPAIS` (de `@/lib/constants-ir`)
- `NATUREZAS_OCUPACAO` (de `@/lib/constants-ir`)

Implementação:
- Importar as constantes e os componentes `Popover` + `Command` (mesmo padrão do step do cliente).
- Cada Combobox mostra o `label` selecionado e grava o `value` no formulário (`form.setValue`).
- Manter o restante do dialog inalterado (escopo estrito).

Resultado: contador edita ocupação/natureza pelas mesmas opções padronizadas que o cliente vê, evitando texto livre divergente.