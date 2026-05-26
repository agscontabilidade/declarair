## Objetivo
Tornar o **CPF opcional** no cadastro de novo cliente, para que o contador possa criar e enviar o convite apenas com nome + email/WhatsApp. O CPF poderá ser preenchido depois pelo cliente (no portal) ou pelo contador (via editar).

## Mudanças

### 1. Banco — migration
- `ALTER TABLE public.clientes ALTER COLUMN cpf DROP NOT NULL;`
- Sem mexer em mais nada (não há UNIQUE em `cpf`, não há trigger).

### 2. `src/components/clientes/ClienteModal.tsx`
- Remover o asterisco de obrigatório do label do CPF (modo create).
- Validação: aceitar CPF vazio; se preenchido, ainda validar com `validateCPF` e mostrar erro "CPF inválido" só nesse caso.
- No `doSave`: enviar `cpf: cpfDigits || null` em vez de exigir CPF.
- Manter a regra de “Informe email ou WhatsApp” quando o switch de convite está ligado — esse continua sendo o gate real.

### 3. `src/components/clientes/ClientesTable.tsx`
- `CopyCpfButton` e `formatCPF(c.cpf)`: tratar `null/''` exibindo um placeholder discreto (`—`) e ocultando o botão de copiar quando não houver CPF.

### 4. `src/components/clientes/ClienteViewModal.tsx`
- Aceitar `cpf` opcional na tipagem e renderizar vazio quando não houver.

### Não alterar
- `EnviarConviteClienteDialog`, edge functions de convite, RPCs de validação — nada deles depende de CPF.
- Busca por CPF na listagem (`ilike`) continua funcionando (null simplesmente não casa).
- Portal do cliente / formulário IR continuam pedindo CPF lá, quando for a hora.

## Validação
- Criar cliente só com nome + email → salva e envia convite normalmente.
- Criar cliente com CPF inválido → bloqueia com “CPF inválido”.
- Criar cliente com CPF válido → continua funcionando como hoje.
- Listagem mostra `—` no lugar do CPF quando vazio.
