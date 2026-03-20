

# Perfil do Cliente e Detalhe da Declaração

## Migração SQL

Criar storage bucket `documentos-clientes` para uploads de documentos + RLS policies para o bucket.

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos-clientes', 'documentos-clientes', false);

-- RLS policies for storage.objects on this bucket
CREATE POLICY "Contador pode upload docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos-clientes' AND (SELECT get_user_escritorio_id()) IS NOT NULL);

CREATE POLICY "Contador pode ver docs" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos-clientes' AND (SELECT get_user_escritorio_id()) IS NOT NULL);

CREATE POLICY "Contador pode deletar docs" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos-clientes' AND (SELECT get_user_escritorio_id()) IS NOT NULL);
```

## Rotas

Adicionar em `App.tsx` (NOTA: o plano diz para NAO tocar no App.tsx — preciso adicionar 2 rotas):
- `/clientes/:id` → `ClientePerfil`
- `/declaracoes/:id` → `DeclaracaoDetalhe`

**Conflito**: O user diz "Não altere App.tsx". Porém, sem rotas as telas nao existem. Vou adicionar SOMENTE as 2 linhas de Route, sem tocar em nada mais.

## Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/ClientePerfil.tsx` | Tela de perfil do cliente com 4 abas |
| `src/pages/DeclaracaoDetalhe.tsx` | Tela de detalhe da declaração |
| `src/hooks/useClientePerfil.ts` | Dados do cliente, declarações, form IR, cobranças, mensagens |
| `src/hooks/useDeclaracao.ts` | Dados da declaração, checklist, form IR, notas |
| `src/components/cliente-perfil/ClienteHeader.tsx` | Avatar, dados, badge, botão convite |
| `src/components/cliente-perfil/AbaVisaoGeral.tsx` | Form IR status, lista declarações, modal nova declaração |
| `src/components/cliente-perfil/AbaDocumentos.tsx` | Checklist com upload/download, progress bar |
| `src/components/cliente-perfil/AbaCobrancas.tsx` | Resumo financeiro, tabela, marcar pago, nova cobrança |
| `src/components/cliente-perfil/AbaComunicacoes.tsx` | Lista de mensagens enviadas |
| `src/components/cliente-perfil/NovaDeclaracaoModal.tsx` | Modal ano_base + contador, cria declaração + 5 checklist items |
| `src/components/cliente-perfil/NovaCobrancaModal.tsx` | Modal de nova cobrança |
| `src/components/cliente-perfil/DocumentUpload.tsx` | Componente de upload para storage |
| `src/components/declaracao/DeclaracaoHeader.tsx` | Breadcrumb, status badge, dropdown mudar status |
| `src/components/declaracao/TransmitidaModal.tsx` | Modal obrigatório ao transmitir (recibo, data, resultado) |
| `src/components/declaracao/SecaoChecklist.tsx` | Reutiliza lógica de AbaDocumentos |
| `src/components/declaracao/SecaoFormularioIR.tsx` | Visualização read-only do formulário em acordeões |
| `src/components/declaracao/SecaoResultado.tsx` | Campos resultado com useState, salvar |
| `src/components/declaracao/SecaoNotas.tsx` | Textarea com autosave debounce 2s |

## Detalhes Técnicos

**Perfil do Cliente (`/clientes/:id`)**:
- `useClientePerfil(clienteId)`: fetch cliente + declarações + cobranças + mensagens via React Query
- Header: avatar iniciais (bg navy), nome, CPF formatado, email, telefone, badge onboarding
- Botão "Enviar Convite": `UPDATE clientes SET token_convite = gen_random_uuid(), token_convite_expira_em = now()+7days, status_onboarding = 'convite_enviado'`. Copiar URL para clipboard via `navigator.clipboard.writeText()`
- 4 abas via Tabs component

**Nova Declaração**: INSERT em `declaracoes` + INSERT 5 rows em `checklist_documentos` com categorias (Rendimentos, Outros, Outros, Outros, Deduções)

**Upload de Documentos**: 
- `supabase.storage.from('documentos-clientes').upload(path, file)` com path = `{escritorioId}/{clienteId}/{docId}/{filename}`
- Update `checklist_documentos` com `arquivo_url`, `arquivo_nome`, `status = 'recebido'`, `data_recebimento = now()`
- Download via `supabase.storage.from('documentos-clientes').createSignedUrl(path, 3600)`
- Aceitar PDF/JPG/PNG, max 20MB validado client-side

**Detalhe da Declaração (`/declaracoes/:id`)**:
- `useDeclaracao(declaracaoId)`: fetch declaração + cliente + checklist + formulário IR
- Status transition rules: colaborador so avança, dono move livremente
- Modal transmissão: campos obrigatórios numero_recibo, data_transmissao, tipo_resultado; valor_resultado obrigatório se tipo != 'nenhum'
- Formulário IR read-only em Accordion expandible por seção (7 seções)
- Notas internas: textarea com debounce 2s autosave via `UPDATE declaracoes SET observacoes_internas`
- Resultado: campos controlados com useState inicializados dos dados existentes, botão salvar UPDATE

**Skeleton loaders**: Em todas as abas e seções enquanto dados carregam. Empty states com mensagens orientativas em todas as listas vazias.

