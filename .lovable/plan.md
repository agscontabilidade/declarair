## Objetivo
Corrigir 2 avisos de segurança nas RLS de `cliente_memorias` e `declaracao_analises`: hoje qualquer `usuario` do escritório acessa tudo. Restringir para que **colaboradores** só vejam dados de clientes onde são `contador_responsavel_id`, mantendo **dono/admin** com acesso total ao escritório.

## Mudanças (apenas SQL — 1 migration)

### 1. `cliente_memorias`
Dropar policies atuais e recriar:
- **SELECT/ALL (dono ou admin)**: `escritorio_id = get_user_escritorio_id() AND (has_role(auth.uid(),'dono') OR has_role(auth.uid(),'admin'))`
- **SELECT/ALL (colaborador)**: `escritorio_id = get_user_escritorio_id() AND cliente_id IN (SELECT id FROM clientes WHERE contador_responsavel_id = auth.uid())`

### 2. `declaracao_analises`
Mesma estrutura, mas filtrando por `declaracao_id` ligado a clientes do contador:
- **dono/admin**: acesso total ao escritório
- **colaborador**: `declaracao_id IN (SELECT d.id FROM declaracoes d JOIN clientes c ON c.id = d.cliente_id WHERE d.escritorio_id = get_user_escritorio_id() AND c.contador_responsavel_id = auth.uid())`

Manter `service_role` com bypass implícito (não precisa de policy adicional).

## Fora de escopo
Nenhuma mudança em frontend, edge functions ou outras tabelas. Sistema em produção — alteração cirúrgica só nas 2 policies.
