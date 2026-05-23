# Plano: Configurações — Persistência, Equipe e Chave Pix

## 1. Bug: Dados do Escritório não persistem visualmente após salvar

**Causa raiz** (em `src/pages/Configuracoes.tsx` + `src/hooks/use-persisted-form.ts`):

O hook `usePersistedForm` grava o form no `localStorage` em todo `useEffect`. Após `handleSave()`:
1. `clearForm()` remove a chave e seta o form para valores vazios.
2. O `useEffect` interno do hook **imediatamente regrava o form vazio no localStorage**.
3. O `useEffect` que preenche o form a partir do banco (linha 133) checa `localStorage.getItem(...)` — encontra a string vazia e **não preenche com os dados recém-salvos do banco**.

Resultado: o `update` no banco funciona, mas a UI mostra os campos vazios — passa a impressão de que "não persistiu".

**Correção:** remover o `usePersistedForm` para esta aba (não faz sentido persistir em localStorage dados de configuração do escritório — a fonte de verdade é o banco). Trocar por `useState` simples inicializado vazio e preenchido via `useEffect` sempre que `escritorio` mudar. Após o save, o `invalidateQueries` refaz o fetch e o `useEffect` repopula naturalmente.

Sem mudanças no schema.

## 2. Aba Usuários — habilitar ações na equipe

Hoje em `AbaEquipe.tsx`:
- A coluna "Ações" só renderiza botões quando `u.papel !== 'dono' && u.ativo`. Para o próprio Responsável Técnico (dono) a célula fica vazia — daí "não é possível fazer nada".
- Para colaboradores já existem ações de gerenciar permissões e desativar, mas falta **editar nome/email** do membro.
- Faltam ações para reativar um membro inativo.

**Mudanças (apenas UI/CRUD em `AbaEquipe.tsx`, sem alterar schema):**

- Adicionar botão **Editar** (ícone `Pencil`) em todas as linhas (inclusive do próprio dono, quando o usuário logado for Responsável Técnico), abrindo um diálogo para editar `nome` e `email` do registro `usuarios`. Update via `supabase.from('usuarios').update(...).eq('id', u.id)`.
- Para usuários `ativo === false`: mostrar botão **Reativar** (atualiza `ativo = true`).
- Manter os botões existentes de Permissões e Desativar para colaboradores ativos.
- Para o Responsável Técnico exibir apenas Editar (nunca Desativar/Permissões — ele tem tudo por padrão).
- Toasts de sucesso/erro e `invalidateQueries(['contadores', escritorioId])` após cada mutação.

As políticas RLS atuais de `usuarios` já permitem ao dono atualizar membros do próprio escritório (confirmar antes de implementar; se necessário ajustar política — só adicionar migration se faltar).

## 3. Novo campo: Chave Pix do Escritório

A coluna `chave_pix` **já existe** em `public.escritorios` (text). Não precisa de migration.

**UI (em `Configuracoes.tsx`, aba Escritório):**

- Adicionar nova seção "Pix do Escritório" após "Responsável Técnico", com:
  - Select de **Tipo de chave**: CPF/CNPJ, E-mail, Telefone, Aleatória.
  - Input **Chave Pix** com máscara dinâmica conforme o tipo.
  - Texto auxiliar: "Esta chave é usada nas cobranças geradas pelo escritório. Somente o Responsável Técnico pode alterá-la."
- Persistência: salvar como string única no campo `chave_pix` (mantendo compatibilidade). Tipo pode ser inferido na leitura ou armazenado como prefixo simples — manteremos só a string crua para não criar coluna nova.
- **Controle de acesso na UI**: o campo é `readOnly` quando `!isDono` (somente Responsável Técnico — papel `dono` — pode alterar). Colaboradores veem somente leitura.
- **Reforço no servidor**: a política RLS atual `Donos podem atualizar seu escritorio` já restringe o `UPDATE` a `papel='dono'`, então colaboradores não conseguem alterar via API mesmo se burlarem a UI. Nenhuma mudança de RLS necessária.

Incluir `chave_pix` no payload do `handleSave` apenas quando `isDono`.

## Arquivos afetados

- `src/pages/Configuracoes.tsx` — remover `usePersistedForm`, adicionar campo Chave Pix com gate por `isDono`.
- `src/components/configuracoes/AbaEquipe.tsx` — adicionar diálogo de edição, botão Reativar e ações para o próprio Responsável Técnico.

## Fora do escopo

- Nenhuma alteração de schema, RLS, edge functions, lógica de billing/cobranças ou nomenclatura.
- Validação avançada da chave Pix (formato por tipo) fica como melhoria futura — só máscara visual.
