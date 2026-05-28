## Problema

`/lembretes` lista clientes apenas pelo `declaracoes.status = 'aguardando_documentos'`. Isso é frágil: o status só muda automaticamente quando o cliente faz upload pelo portal. Existem cenários reais onde o cliente já enviou documentos mas o status continua `aguardando_documentos`:

- Contador anexou o documento manualmente pelo perfil do cliente (insere em `checklist_documentos` com status `recebido`, mas não muda o status da declaração).
- Documentos enviados em anos anteriores ou via fluxos legados (`arquivos_outros` no `declaracoes`, `arquivo_*_url` específicos).
- Falha pontual em algum gatilho de mudança de status (regressão / dados antigos).
- Upload direto via Drive para a pasta do cliente sem atualização da `declaracoes`.

Risco: contador dispara lembrete cobrando documento de quem já enviou. Inaceitável em produção.

## Solução — defesa em profundidade (somente leitura, sem mudar status)

Filtrar no hook `useLembretesPendentes` removendo qualquer cliente que tenha **qualquer indício** de documento já entregue para a declaração do ano corrente. Nada de schema novo, nada de mudar status automaticamente — só não listar.

### Sinais que excluem o cliente da lista de lembretes

Para cada declaração do ano corrente em `aguardando_documentos`, considera "já tem documento" se **qualquer** destas condições for verdadeira:

1. Existe linha em `checklist_documentos` para `declaracao_id` com `status = 'recebido'` **ou** com `arquivo_url` não nulo.
2. `declaracoes.arquivos_outros` é array com pelo menos 1 item.
3. Qualquer um destes campos da `declaracoes` está preenchido: `arquivo_declaracao_url`, `arquivo_recibo_url`, `arquivo_darf_url`, `arquivo_mei_url`, `arquivo_analise_caixa_url`.
4. (Camada extra, defensiva) Storage `documentos-clientes` tem pelo menos 1 objeto sob o prefixo `{escritorio_id}/{cliente_id}/` ignorando sufixos `.ocr.pdf` (sidecar de OCR não conta como documento novo).

Se qualquer sinal for verdadeiro → **não aparece em `/lembretes`**, e ainda registra um pequeno aviso no console com o motivo (debug).

### Implementação

Arquivo único: `src/hooks/useLembretesPendentes.ts`.

Passos dentro do `queryFn`, após buscar `decls`:

1. Coletar `declaracaoIds` e `clienteIds`.
2. Em paralelo (`Promise.all`):
   - `supabase.from('checklist_documentos').select('declaracao_id, status, arquivo_url').in('declaracao_id', declaracaoIds)`
   - Para campos 2 e 3, já estão disponíveis em `decls` — adicionar à seleção atual: `arquivos_outros, arquivo_declaracao_url, arquivo_recibo_url, arquivo_darf_url, arquivo_mei_url, arquivo_analise_caixa_url`.
   - Para storage (camada 4): `supabase.storage.from('documentos-clientes').list(\`${escritorioId}/${clienteId}\`, { limit: 5 })` por cliente, com `Promise.allSettled` e `limit` de concorrência simples (ex.: lotes de 8). Filtra nomes terminando em `.ocr.pdf`. Se a chamada falhar (permissão / inexistente), trata como "sem objetos" — nunca bloqueia a lista por erro de storage.
3. Construir um `Set<clienteId>` de "clientes com documento" e remover esses do array final retornado.
4. Manter ordenação e shape atuais — nenhuma mudança no componente `Lembretes.tsx` nem no `LembreteEnvioModal`.

### Reforço no backend (edge function `enviar-lembretes-prazo`)

Como rede de segurança, replicar as checagens 1–3 na função (storage list é opcional aqui para não custar I/O). Antes de enfileirar email/WhatsApp para um cliente, se houver qualquer sinal de documento entregue, pular com motivo `ja_possui_documentos`. Isso garante que mesmo se o front estiver desatualizado em cache, nenhum lembrete sai indevidamente.

### O que NÃO muda

- Nenhuma migração de banco.
- Nenhum status é alterado automaticamente.
- UI da página `/lembretes` permanece igual (apenas a lista fica mais precisa).
- Modal, fluxo de envio, automações WhatsApp, contadores — tudo intacto.
- RLS, multi-tenant, permissões — sem alteração.

### Critério de aceite

- Cliente com `aguardando_documentos` + qualquer `checklist_documentos.status='recebido'` **não aparece** em `/lembretes`.
- Cliente com qualquer `arquivo_*_url` preenchido na declaração **não aparece**.
- Cliente com `arquivos_outros` não vazio **não aparece**.
- Cliente com objetos no storage `{escritorio_id}/{cliente_id}/...` (excluindo `.ocr.pdf`) **não aparece**.
- Edge function `enviar-lembretes-prazo` retorna `pulados` com motivo `ja_possui_documentos` se o cliente, por race condition, tiver enviado entre o list e o envio.
- Clientes legitimamente sem nenhum documento continuam aparecendo normalmente.
