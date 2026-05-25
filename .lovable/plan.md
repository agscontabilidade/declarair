## Diagnóstico

Auditei o fluxo do portal do cliente em `/cliente/documentos` (`src/pages/cliente/ClienteDocumentos.tsx`, `useClientePortal.ts`) cruzando com as políticas RLS no banco. O toast vermelho da tela enviada — **"Não foi possível preparar sua declaração. Contate seu contador."** — vem da linha 110 do `ClienteDocumentos.tsx`, que dispara quando o `INSERT` em `declaracoes` falha.

Encontrei **três bloqueios reais de RLS no lado do cliente** e alguns pontos secundários.

### 1. Cliente não consegue criar declaração (CRÍTICO — causa do erro na tela)

Política `Inserir declaracoes no escritorio` só permite quando `escritorio_id = get_user_escritorio_id()`. Essa função busca em `public.usuarios` — clientes não estão lá, então retorna `NULL` e o `INSERT` é bloqueado. Não existe política equivalente para o cliente.

Quando o cliente entra em `/cliente/documentos` antes do contador ter criado a declaração do ano corrente (ou se só existe declaração de ano anterior), o código tenta auto-criar e leva o erro. É exatamente o caso desse cliente.

### 2. Cliente não consegue atualizar status da própria declaração (CRÍTICO — silencioso)

Política `Atualizar declaracoes do escritorio` exige `escritorio_id = get_user_escritorio_id()`. Os `UPDATE` em `ClienteDocumentos.tsx` (linhas 224 e 270) que mudam `status` para `documentacao_recebida` e `status_documentos` para `enviado` rodam, mas o RLS filtra silenciosamente: zero linhas afetadas, sem erro. Resultado: contador nunca vê "documentos enviados", kanban não move, sininho não toca.

### 3. Cliente não consegue inserir notificação para o contador (CRÍTICO — silencioso)

Política `Usuarios inserem notificacoes no escritorio` exige escritório do usuário. Os `INSERT` em `notificacoes` (linhas 282 e 316) feitos pelo cliente são bloqueados. Erro é ignorado (`await` sem checagem). Contador nunca recebe notificação de envio nem de remoção de documento.

### 4. Pontos secundários (não bloqueiam, mas vale corrigir junto)

- **Trigger `enforce_declaracao_limit`**: se o escritório atingiu o limite do plano, qualquer tentativa do cliente criar declaração levanta exceção. Hoje cai no toast genérico; deveria ter mensagem mais clara. (Confirmar se é o caso desse cliente — checar limite vs uso no escritório dele.)
- **Categoria `documento_enviado`** (linha 204) não existe em `CATEGORIA_META` nem em `LEGACY_MAP`. Não bloqueia, mas o documento pode renderizar sem ícone/label correto.
- **`removeFile`** (linha 299) usa `declaracao?.id` em `.eq` sem checar — se `declaracao` for `null`, o filtro vira `is null` e pode afetar outras linhas que o RLS deixe passar. Risco baixo, mas vale guardar.

---

## Plano de correção (escopo estrito)

### A. Migração SQL — políticas RLS faltantes para o cliente

1. **`declaracoes` INSERT para cliente**: nova policy `Cliente pode criar sua declaracao` permitindo `cliente_id = get_user_cliente_id()`.
2. **`declaracoes` UPDATE para cliente**: nova policy `Cliente pode atualizar sua declaracao` (USING e WITH CHECK = `cliente_id = get_user_cliente_id()`).  
   Restringir colunas via trigger BEFORE UPDATE: cliente só pode alterar `status`, `status_documentos`, `ultima_atualizacao_status` (preserva `valor_resultado`, `numero_recibo`, `contador_id`, `escritorio_id` etc.).
3. **`notificacoes` INSERT para cliente**: nova policy `Cliente pode notificar seu escritorio` permitindo inserir quando `escritorio_id` for o escritório do cliente logado (via subquery em `clientes` por `get_user_cliente_id()`).

### B. Mensagem de erro do limite de declarações

Ajustar `enforce_declaracao_limit` para retornar mensagem mais explícita ("Limite do plano do escritório atingido — peça ao contador para liberar mais uma declaração."), e tratar essa mensagem em `ClienteDocumentos.tsx` para mostrar toast amigável.

### C. Ajustes mínimos no `ClienteDocumentos.tsx`

- Após cada `update`/`insert` que afeta o contador, ler o retorno (`.select()`) e logar erro se zero linhas — para não falhar silenciosamente nunca mais.
- Guardar `removeFile` contra `declaracao` nulo.
- Registrar a categoria `documento_enviado` em `CATEGORIA_META` (label "Documento Enviado", ícone `FileText`) para render consistente.

### D. Verificação pós-fix

1. Rodar como o cliente afetado (ou simular): abrir `/cliente/documentos`, anexar PDF de teste, confirmar:
   - Declaração criada para o ano corrente.
   - `status` muda para `documentacao_recebida`.
   - Notificação aparece para o contador.
2. Conferir limite atual do escritório do cliente (`SELECT limite_declaracoes, declaracoes_utilizadas FROM escritorios WHERE id=...`) para descartar bloqueio por plano.

---

## Fora de escopo

- Não vou mexer em billing, formulário IR, kanban, layout, autenticação, storage policies (bucket `documentos-clientes` já funciona — uploads sobem mesmo quando o resto falha).
- Não vou refatorar o hook ou os caches do React Query.
- Sem schema novo além das policies + 1 trigger de coluna restritiva.

## Risco

Baixo. As policies adicionam acesso onde hoje não existe (não removem nem afrouxam regras do contador). O trigger de colunas protege contra cliente alterar campos sensíveis. Todas as mudanças são aditivas e reversíveis.
