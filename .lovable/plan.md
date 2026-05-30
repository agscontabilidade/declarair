## Problema

Ao excluir o cliente "Gelson Santos" o Postgres bloqueia com:

> update or delete on table "clientes" violates foreign key constraint "mensagens_enviadas_cliente_id_fkey" on table "mensagens_enviadas"

A FK `mensagens_enviadas.cliente_id → clientes.id` foi criada sem `ON DELETE CASCADE`, então enquanto houver registros em `mensagens_enviadas` (lembretes/WhatsApp/e-mails enviados) o cliente não pode ser apagado. Outras tabelas filhas (declarações, cobranças, checklist, formulário, chat, etc.) provavelmente têm o mesmo problema latente.

## Decisão do usuário

Apagar tudo junto (CASCADE). Histórico de mensagens/cobranças/declarações do cliente é descartado quando o cliente é excluído.

## O que vou fazer

Migration única que:

1. Detecta todas as FKs que referenciam `public.clientes(id)`.
2. Para cada uma, dropa a constraint atual e recria com `ON DELETE CASCADE`, preservando nome, coluna e `ON UPDATE`.
3. Tabelas conhecidas que serão afetadas (cascateadas ao apagar cliente):
   - `mensagens_enviadas` (causa do erro atual)
   - `declaracoes` → e via cascata: `checklist_documentos`, `formulario_ir`, `declaracao_atividades`, `declaracao_analises`, `declaracao_notas_internas`, `mensagens_chat`, `declaracoes_extras` (quando vinculado)
   - `cobrancas`
   - `cliente_memorias`
   - `convites_cliente` (campo `usado_por_cliente_id` → `SET NULL` em vez de cascade, pra preservar histórico do convite)
   - Quaisquer outras FKs detectadas dinamicamente apontando para `clientes(id)` recebem `CASCADE`.

A migration será idempotente (usa `DO $$ ... $$` iterando em `information_schema`).

## Sem mudanças de código

`Clientes.tsx` e `useClientes.deleteCliente` já fazem `DELETE` direto — não precisam mudar. O toast de erro existente continuará funcionando para outros casos.

## Riscos

- **Perda de histórico**: confirmado pelo usuário. Excluir cliente apaga mensagens enviadas, cobranças (incluindo pagas), declarações de anos anteriores, chat, anexos referenciados, etc. Arquivos no Storage NÃO são apagados automaticamente — ficarão órfãos no bucket (limpeza fica fora deste escopo).
- **Sem rollback fácil**: depois de cascatear, dados não voltam. Recomendo testar primeiro num cliente sem histórico relevante.

## Detalhes técnicos

```sql
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tc.table_schema, tc.table_name, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name
     AND kcu.table_schema  = tc.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema  = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_schema = 'public'
      AND ccu.table_name   = 'clientes'
      AND ccu.column_name  = 'id'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
                   r.table_schema, r.table_name, r.constraint_name);
    -- convites_cliente.usado_por_cliente_id usa SET NULL; demais usam CASCADE
    IF r.table_name = 'convites_cliente' THEN
      EXECUTE format(
        'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.clientes(id) ON DELETE SET NULL',
        r.table_schema, r.table_name, r.constraint_name, r.column_name);
    ELSE
      EXECUTE format(
        'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.clientes(id) ON DELETE CASCADE',
        r.table_schema, r.table_name, r.constraint_name, r.column_name);
    END IF;
  END LOOP;
END $$;
```

Depois disso, deletar o "Gelson Santos" funcionará normalmente.
