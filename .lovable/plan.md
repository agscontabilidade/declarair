## Bug
Em `src/pages/Drive.tsx` linha 62, o filtro de busca é:

```ts
if (busca && !cl.nome?.toLowerCase().includes(busca.toLowerCase())
          && !cl.cpf?.includes(busca.replace(/\D/g, ''))) continue;
```

Ao digitar um **nome** (ex.: "ana"), `busca.replace(/\D/g, '')` resulta em `""`. Como `string.includes("")` é sempre `true`, o segundo termo do `&&` é sempre falso → a linha nunca executa `continue` → nenhum cliente é filtrado. Resultado: a busca por nome parece não funcionar.

## Correção (apenas Drive.tsx, linha 62)

Calcular os dois termos separadamente e só considerar o match por CPF quando o usuário digitou dígitos:

```ts
const termo = busca.trim().toLowerCase();
const digitos = busca.replace(/\D/g, '');
const matchNome = termo ? cl.nome?.toLowerCase().includes(termo) : true;
const matchCpf  = digitos ? cl.cpf?.replace(/\D/g, '').includes(digitos) : false;
if (busca && !matchNome && !matchCpf) continue;
```

Também normalizo `cl.cpf` removendo pontuação antes do `includes`, para que a busca por CPF funcione mesmo se o valor armazenado vier formatado.

Sem mudanças em queries, RLS, layout ou outros arquivos.