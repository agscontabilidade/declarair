## Escopo (somente portal do cliente — `/cliente/*`)

Alterações no frontend do cliente. Nenhuma mudança em RLS, schema do banco, ou áreas do contador.

---

### 1. Dashboard sempre visível, mesmo sem documentos enviados (`ClienteDashboard.tsx`)

Hoje o dashboard só renderiza stepper + cards se já existe `declaracao`. Como agora a declaração é criada automaticamente no signup do cliente (já confirmado no banco), o caminho "sem declaração" fica como fallback. Vou:

- Manter o estado vazio só quando realmente não há `declaracao` (ex.: cliente antigo).
- Garantir que, existindo `declaracao` mesmo com **0 documentos** e **formulário vazio**, os 3 cards apareçam normalmente com os badges corretos:
  - Informações Cadastrais → **Pendente** (laranja, 0%)
  - Envio de Documentos → **Pendente** (laranja, 0 docs)
  - Resultado Final → Aguardando transmissão

### 2. Stepper: timestamps + pulse suave na etapa atual (`StatusStepper.tsx`)

Adicionar prop `stepTimestamps: (string | null)[]` (1 por etapa). Para cada bolinha concluída ou atual, mostrar abaixo do label um pequeno texto `dd/MM HH:mm`. Etapa atual ganha classe `animate-pulse` suave (Tailwind, sem keyframes novos).

Fonte dos timestamps (calculada no `useClientePortal.ts`):

- Etapa 1 (Dados Cadastrais) → `formulario.updated_at` quando `status_preenchimento = 'concluido'`.
- Etapa 2 (Enviar Documentos) → `MAX(checklist_documentos.data_recebimento)` quando houver ao menos 1 doc com `status = 'recebido'`.
- Etapa 3 (Documentação Recebida) → mais recente `declaracao_atividades.created_at` onde `descricao LIKE 'Status alterado % para documentacao_recebida'`.
- Etapa 4 (Declaração Pronta) → mesmo padrão para `declaracao_pronta`.
- Etapa 5 (Transmitida) → `declaracao.data_transmissao`.

Vou adicionar uma query no `useClientePortal` para buscar `declaracao_atividades` filtrada por `declaracao_id` e tipo `status_change`, derivar o map em memória.

### 3. Porcentagem real do card "Informações Cadastrais"

Substituir a regra binária (50% ou 100%) por cálculo baseado nos campos preenchidos no `formulario_ir`. Pesos simples, somando 100%:

| Bloco | Peso | Critério "preenchido" |
|---|---|---|
| Estado civil + data nascimento | 10 | ambos não vazios |
| Endereço (cep, logradouro, numero, bairro, cidade, uf) | 15 | todos preenchidos |
| Ocupação principal | 5 | preenchida |
| Rendimentos (emprego/autônomo/aluguel/outros) | 25 | ao menos 1 item em qualquer array OU `status_preenchimento = 'concluido'` |
| Bens e direitos | 10 | array não vazio OU concluído |
| Dívidas | 5 | array não vazio OU concluído (opcional, conta só se houver) |
| Deduções (médicas/educação/previdência) | 15 | ao menos 1 item OU concluído |
| Dependentes/alimentandos (opcional) | 5 | declarados OU concluído |
| Informações adicionais / chave Pix | 10 | preenchidos |

Regras de borda:
- Se `formulario` não existe → 0% e badge **Pendente**.
- Se `status_preenchimento = 'concluido'` → 100% e badge **Preenchido** (sobrescreve o cálculo).
- Caso contrário → mostra `%` calculada e badge **Pendente** (laranja) se < 100%.

Lógica vai em helper `calcularProgressoFormulario(formulario)` em `src/lib/cliente-portal-progress.ts` (novo arquivo pequeno, isolado).

### 4. `ClienteDocumentos`: exclusão já existe — apenas auditar

Conferi: a exclusão **já está implementada** (`removeFile` + `AlertDialog` no card "Arquivos Anexados"). Botão fica oculto quando `docsEnviadosAoContador = true`. Vou:

- Manter como está; apenas verificar se aparece corretamente quando o cliente acabou de subir um doc errado (antes de "Enviar ao Contador").
- Confirmar que o `AlertDialog` com `Trash2` é claro o suficiente.

Se a intenção do usuário for permitir excluir **mesmo após "Enviado ao Contador"**, isso muda a regra de negócio e prefiro confirmar antes (ver "Pergunta em aberto").

### 5. Cards em tom de alerta laranja suave

Trocar a paleta dos dois cards informativos:

- **Procuração Eletrônica e-CAC** (dashboard) — hoje `border-primary/20 bg-primary/5`.
- **Não sabe quais documentos enviar?** (documentos) — hoje `border-primary/20 bg-primary/5`.

Para o token semântico já existente do sistema: `border-warning/30 bg-warning/5`, ícone em `text-warning`, mantendo o botão primário (verde) para não competir com o alerta. Sem cores hardcoded.

### 6. Remover "Meu Perfil" do menu do cliente (`ClienteLayout.tsx`)

Tirar o item `{ title: 'Meu Perfil', url: '/perfil', icon: User }` do array `navItems`. A rota `/perfil` é `allowedType="contador"` (já protegida), então clicar nela como cliente já dava erro — remover só limpa a UI. Não mexo na rota nem na página `Perfil.tsx` (usadas pelo contador).

---

### Pergunta em aberto

> "retire também qualquer **tabela** que faça referência a esses dados. Não vejo funcionalidade uma vez que temos os dados cadastrais."

Não está claro o que é "tabela" aqui. Hipóteses:
- (a) Seção/aba na UI do cliente que duplique dados de perfil → **não encontrei nenhuma** no portal do cliente além do próprio formulário. Posso só remover o menu.
- (b) Tabela do banco (`usuarios` ou similar) referente ao cliente → **risco alto em produção**, não faço sem confirmação explícita.

**Vou seguir com (a)** — só remover o menu — e deixar (b) para você confirmar se realmente quer. Se confirmar, isolo numa próxima etapa.

---

### Arquivos tocados

- `src/components/layout/ClienteLayout.tsx` — remover item do menu.
- `src/components/cliente-portal/StatusStepper.tsx` — props para timestamps + pulse.
- `src/hooks/useClientePortal.ts` — query de `declaracao_atividades` + map de timestamps por etapa.
- `src/lib/cliente-portal-progress.ts` (novo) — helper de % do formulário.
- `src/pages/cliente/ClienteDashboard.tsx` — usar % real, passar timestamps ao stepper, cor warning no card e-CAC, garantir render sempre que houver declaração.
- `src/pages/cliente/ClienteDocumentos.tsx` — cor warning no card de ajuda; exclusão já existente mantida.

### Fora de escopo

- Schema / RLS / triggers / edge functions.
- Rotas e código do contador.
- Página `Perfil.tsx` (usada pelo contador).
- Qualquer alteração em tabelas do banco.
