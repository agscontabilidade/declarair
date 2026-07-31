# Acesso do contador ao portal do cliente ("Ver como cliente")

Permitir que o contador abra, dentro do próprio sistema, exatamente a tela que o cliente vê — sem precisar da senha do cliente e sem trocar de sessão.

## Como vai funcionar

1. Em `/clientes`, cada linha da listagem ganha um botão de ação (ícone de olho, "Ver portal do cliente"), ao lado dos botões atuais (cobrança, convite, WhatsApp, editar).
2. Ao clicar, o contador é levado para `/clientes/:id/portal`, que renderiza o portal do cliente (Início, Dados Cadastrais, Documentos) com os dados daquele contribuinte.
3. No topo aparece uma faixa fixa de aviso: "Você está visualizando o portal de <Nome> como contador" + botão "Sair da visualização" (volta para `/clientes`).
4. A sessão continua sendo a do contador. Nada de login como cliente, nada de token de cliente, nada de troca de usuário.

## Modo de acesso

Visualização espelhada com as mesmas ações que o cliente tem (envio/remoção de documentos e preenchimento do formulário), executadas com a identidade do contador. Alternativa possível: somente leitura. A implementação começa por leitura + uploads de documentos; edição do formulário do cliente fica habilitada apenas se você confirmar que quer isso.

## Segurança

- Só contador/colaborador autenticado acessa a rota, e apenas para clientes do próprio escritório (validação na consulta + RLS por `escritorio_id`).
- Nenhuma alteração de RLS é necessária: o contador já tem permissão de leitura sobre `clientes`, `declaracoes`, `checklist_documentos`, `formulario_ir` e sobre o storage no prefixo `{escritorio_id}/`.
- Nenhuma migração de banco.
- Registro simples no histórico da declaração (`declaracao_atividades`) apenas quando o contador realizar uma ação de escrita nesse modo — não em cada visualização, para não gerar carga.

## Detalhes técnicos

- Novo `PortalViewContext` (`src/contexts/PortalViewContext.tsx`) expondo `{ clienteId, clienteNome, isImpersonating }`.
- `useClientePortal`, `ClienteLayout` e as páginas `ClienteDashboard`, `ClienteFormulario`, `ClienteDocumentos` passam a resolver o cliente efetivo por um hook único `useClienteAtivo()`, que retorna o `clienteId` do contexto de impersonação quando presente e cai para `profile.clienteId` no fluxo normal do cliente. Nenhuma quebra do portal real.
- Nova rota em `App.tsx`: `/clientes/:id/portal` protegida por `ProtectedRoute allowedType="contador"` + `BillingGate`, envolvendo o provider e um `<PortalImpersonado />` com sub-abas internas (dashboard/formulário/documentos) sem alterar as rotas `/cliente/*`.
- Botão novo em `src/components/clientes/ClientesTable.tsx` respeitando `usePermissoes().podeVerClientes`.
- Barra de aviso em `src/components/cliente-portal/ImpersonationBanner.tsx`.
- Sem alteração em `src/integrations/supabase/*` nem em edge functions.

## Fora de escopo

- Correção do acesso dos clientes aos documentos enviados pelo escritório (path do storage) — continua pendente e será tratada depois, como combinado.
