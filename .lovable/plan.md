## Diagnóstico

O erro vem da trigger `restrict_cliente_declaracao_update` criada hoje pela migration `20260525164812` em `public.declaracoes`. Ela bloqueia o cliente de alterar campos sensíveis (`arquivo_declaracao_url`, `arquivo_recibo_url`, etc.), mas tem dois bypasses que **não estão funcionando** para o fluxo de anexar do contador:

```sql
IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
  RETURN NEW;
END IF;
IF public.get_user_escritorio_id() IS NOT NULL THEN
  RETURN NEW;
END IF;
-- senão: bloqueia
```

**O que está quebrado:**

1. **Anexar do contador (botão "Anexar declaração" em `/declaracoes`)** chama a edge function `processar-pdf-declaracao`, que faz o `update` em `declaracoes` usando o **service role**. Em PostgREST/Supabase atual, o GUC legado `request.jwt.claim.role` **não é mais populado** — só existe `request.jwt.claims` (JSON, plural). Resultado: a primeira condição devolve NULL ≠ `'service_role'`, **falha**. Em seguida `auth.uid()` é NULL para service role, então `get_user_escritorio_id()` retorna NULL, **falha de novo**. A trigger conclui que é cliente e dispara a exception "Cliente nao pode alterar campos sensiveis da declaracao".

2. Mesmo contador autenticado direto via PostgREST cai no segundo bypass corretamente (porque `get_user_escritorio_id()` retorna o escritório dele), então updates de campos não-sensíveis seguem funcionando — o problema é específico do caminho service-role.

## Correção (1 migration)

Substituir a função `public.restrict_cliente_declaracao_update()` para detectar service role de forma robusta, usando o helper oficial `auth.role()` e como fallback o JSON `request.jwt.claims`:

```sql
CREATE OR REPLACE FUNCTION public.restrict_cliente_declaracao_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_role text;
BEGIN
  -- 1) service_role (edge functions com SERVICE_ROLE_KEY) passa direto
  BEGIN
    v_role := auth.role();
  EXCEPTION WHEN OTHERS THEN
    v_role := NULL;
  END;

  IF v_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Fallback: lê do JWT claims (formato atual do PostgREST)
  IF current_setting('request.jwt.claims', true) IS NOT NULL
     AND (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
  THEN
    RETURN NEW;
  END IF;

  -- 2) contador / colaborador (linha em public.usuarios) passa direto
  IF public.get_user_escritorio_id() IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- 3) admin global também passa
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- 4) restante = cliente: aplica restrições originais (campos + status)
  IF NEW.cliente_id IS DISTINCT FROM OLD.cliente_id
     OR NEW.escritorio_id IS DISTINCT FROM OLD.escritorio_id
     OR NEW.contador_id IS DISTINCT FROM OLD.contador_id
     OR NEW.ano_base IS DISTINCT FROM OLD.ano_base
     OR NEW.tipo_resultado IS DISTINCT FROM OLD.tipo_resultado
     OR NEW.valor_resultado IS DISTINCT FROM OLD.valor_resultado
     OR NEW.numero_recibo IS DISTINCT FROM OLD.numero_recibo
     OR NEW.data_transmissao IS DISTINCT FROM OLD.data_transmissao
     OR NEW.forma_tributacao IS DISTINCT FROM OLD.forma_tributacao
     OR NEW.observacoes_internas IS DISTINCT FROM OLD.observacoes_internas
     OR NEW.arquivo_declaracao_url IS DISTINCT FROM OLD.arquivo_declaracao_url
     OR NEW.arquivo_recibo_url    IS DISTINCT FROM OLD.arquivo_recibo_url
     OR NEW.arquivo_mei_url       IS DISTINCT FROM OLD.arquivo_mei_url
     OR NEW.arquivo_darf_url      IS DISTINCT FROM OLD.arquivo_darf_url
     OR NEW.arquivo_analise_caixa_url IS DISTINCT FROM OLD.arquivo_analise_caixa_url
  THEN
    RAISE EXCEPTION 'Cliente nao pode alterar campos sensiveis da declaracao';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status NOT IN ('aguardando_documentos', 'documentacao_recebida')
  THEN
    RAISE EXCEPTION 'Cliente nao pode definir status %', NEW.status;
  END IF;

  RETURN NEW;
END;
$$;
```

A trigger continua a mesma (`BEFORE UPDATE`), só a função muda.

## Por que isso resolve

- `auth.role()` é o helper oficial do Supabase para extrair o `role` do JWT atual e devolve `'service_role'` quando a edge function usa a SERVICE_ROLE_KEY. Mesmo que num ambiente futuro `auth.role()` falhe, o fallback lendo `request.jwt.claims::jsonb->>'role'` cobre.
- Contador continua passando pelo bypass de `get_user_escritorio_id()` (igual antes — não muda nada para quem já funcionava).
- Admin global ganha bypass explícito (consistente com as policies que já permitem `has_role(...,'admin')`).
- Restrições contra cliente continuam idênticas (mesmos campos, mesma whitelist de status).

## Escopo

- 1 migration SQL, só substituindo a função.
- Zero alteração em código de aplicação, edge functions ou RLS policies.
- Sem mudança de schema.
