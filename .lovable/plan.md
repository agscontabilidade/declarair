## Problemas identificados

### 1. Busca por nome não funciona em `/declaracoes`
Em `src/pages/Declaracoes.tsx` (linhas 156-164):

```ts
const cpfDigits = d.clienteCpf.replace(/\D/g, '');
if (!d.clienteNome.toLowerCase().includes(s) && !cpfDigits.includes(s.replace(/\D/g, ''))) return false;
```

Quando o usuário digita um nome (ex: "Maria"), `s.replace(/\D/g, '')` vira string vazia `''`. Em JavaScript, `qualquerString.includes('')` sempre retorna `true`, então a condição CPF nunca exclui ninguém — mas como está encadeada com `&&`, a expressão completa fica `false` e nada é filtrado de fato pelo nome. Resultado: a busca por nome parece sem efeito.

Além disso, `debouncedSearch` é calculado mas nunca usado.

**Correção:** separar as duas verificações; só comparar CPF quando o termo digitado contém dígitos; usar `debouncedSearch` no filtro.

### 2. Observação salva não aparece na lista
O `ObservacoesModal` invalida `['declaracoes-lista']` no sucesso, mas:
- O canal Realtime atual só escuta a tabela `declaracoes`, não `declaracao_notas_internas`.
- Em alguns casos o React Query mantém os dados antigos visíveis até o refetch concluir, e o usuário tem a impressão de que "sumiu".

**Correção:** após salvar, forçar `refetchQueries` (não só invalidate) da lista, e adicionar canal Realtime para `declaracao_notas_internas` filtrado por `escritorio_id`.

## Mudanças

**`src/pages/Declaracoes.tsx`**
- Substituir o filtro de busca para usar `debouncedSearch` e tratar separadamente termo de texto vs. dígitos:
  ```ts
  const term = debouncedSearch.trim().toLowerCase();
  const digits = term.replace(/\D/g, '');
  if (term) {
    const matchNome = d.clienteNome.toLowerCase().includes(term);
    const matchCpf = digits.length > 0 && d.clienteCpf.replace(/\D/g, '').includes(digits);
    if (!matchNome && !matchCpf) return false;
  }
  ```
- Adicionar segundo canal Realtime para `declaracao_notas_internas` filtrado por `escritorio_id=eq.{escritorioId}` que invalida a mesma `queryKey`.

**`src/components/declaracoes/ObservacoesModal.tsx`**
- Trocar `invalidateQueries` por `refetchQueries` na lista para garantir atualização imediata visível antes do modal fechar.

## Resultado esperado
- Buscar "Maria" filtra a tabela corretamente.
- Após salvar uma observação, o badge verde com o conteúdo aparece imediatamente na linha correspondente.