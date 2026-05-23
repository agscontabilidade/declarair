## Objetivo

Adicionar edição inline (modais) na aba **Informações Cadastrais** de `/declaracoes/:id`, permitindo ao contador corrigir erros de digitação nos dados que hoje são apenas leitura.

## Escopo (4 cards já existentes em `SecaoInformacoesCadastrais.tsx`)

1. **Dados pessoais** → edita `clientes` (nome, cpf, email, telefone, data_nascimento) + `formulario_ir` (estado_civil, conjuge_nome, conjuge_cpf, raca_cor, ocupacao_principal, natureza_ocupacao, data_nascimento)
2. **Endereço** → edita `formulario_ir` (cep, logradouro, numero, complemento, bairro, cidade, uf) — com auto-preenchimento via ViaCEP
3. **Chave Pix** → edita `formulario_ir.chave_pix_cliente` (validação: se restituição, exige CPF do titular conforme regra fiscal)
4. **Dependentes** → CRUD de itens do array JSONB `formulario_ir.dependentes` (nome, cpf obrigatório, parentesco, data_nascimento)

## UX

- Cada card ganha um botão discreto **"Editar"** (ícone `Pencil`) no header, ao lado do badge.
- Clique abre um **Dialog** específico com formulário (react-hook-form + Zod).
- Card de Dependentes: dialog lista os existentes com botões "Editar" e "Remover", além de "Adicionar dependente".
- Após salvar: toast de sucesso + `invalidateQueries(['info-cadastrais', ...])` para refletir imediatamente.
- Se ainda não existe linha em `formulario_ir` para a declaração, faz **upsert** (insert com `declaracao_id`, `cliente_id`, `ano_base`).

## Implementação técnica

Novos arquivos:
- `src/components/declaracao/editar/EditarDadosPessoaisDialog.tsx`
- `src/components/declaracao/editar/EditarEnderecoDialog.tsx` (reusa hook ViaCEP existente)
- `src/components/declaracao/editar/EditarChavePixDialog.tsx`
- `src/components/declaracao/editar/EditarDependentesDialog.tsx`
- `src/components/declaracao/editar/schemas.ts` — schemas Zod (CPF, email, datas)

Edits:
- `SecaoInformacoesCadastrais.tsx` — adiciona botão "Editar" em cada card e renderiza os dialogs controlados por estado local. Mantém a mesma query `['info-cadastrais', ...]`.

Regras / segurança:
- RLS atual já cobre: contador do escritório pode atualizar `clientes` e `formulario_ir` do próprio tenant — sem migração necessária.
- Manter máscaras PT-BR (CPF, telefone, data DD/MM/AAAA) e validação Zod estrita (sem `any`).
- Sem alteração de lógica de negócio (status, kanban, IA, etc.) — escopo estritamente visual/edição.

## Fora do escopo

- Histórico/auditoria de edições (já existe trigger geral).
- Edição de rendimentos, bens, despesas (essas abas têm seções próprias).
- Mudanças no portal do cliente.