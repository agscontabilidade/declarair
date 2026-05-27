
## Objetivo

Hoje todos os emails enviados chegam como **"DeclaraIR <noreply@declarair.com.br>"**. Muitos contribuintes acham que é spam por não conhecerem a marca. O plano é fazer cada email sair com o **nome do escritório do contador** no campo "De", mantendo o domínio verificado da plataforma (que não pode mudar, pois é o que garante entrega).

Resultado visual na caixa de entrada:
- Antes: `DeclaraIR` → Declaração IRPF 2026 - AGS CONTABILIDADE...
- Depois: `AGS Contabilidade Integrada` → Declaração IRPF 2026...

## Como funciona tecnicamente

O campo "De" de um email tem duas partes: **nome amigável** (visível ao usuário) + **endereço técnico**. Exemplo:
```
AGS Contabilidade Integrada <noreply@declarair.com.br>
```

O endereço técnico **precisa continuar em `declarair.com.br`** porque é o domínio verificado (DNS, SPF, DKIM). O que vamos personalizar é o **nome amigável** — é isso que o cliente vê no Gmail/Outlook.

Adicional: usar o **email do escritório como `Reply-To`**, para que quando o cliente clicar em "Responder", a resposta vá direto para o contador, não para a plataforma.

## Mudanças

### 1. Edge function `send-transactional-email`
- Aceitar um novo parâmetro opcional `escritorioId` no body.
- Quando recebido, buscar `nome` e `email` da tabela `escritorios`.
- Montar `from` dinamicamente:
  - Com escritório: `"AGS Contabilidade <noreply@declarair.com.br>"`
  - Sem escritório (fallback, ex: emails do sistema/admin): `"DeclaraIR <noreply@declarair.com.br>"`
- Adicionar `reply_to: <email do escritório>` ao payload da fila quando disponível.
- Sanitizar o nome (remover caracteres que quebram o header: `<`, `>`, `"`, quebras de linha).

### 2. Dispatcher `process-email-queue`
- Repassar `reply_to` para a API de envio (Lovable Email aceita esse campo).

### 3. Todos os call-sites de `supabase.functions.invoke('send-transactional-email', ...)`
Localizações conhecidas a atualizar para enviar `escritorioId`:
- `EnviarConviteClienteDialog`, `GerarLinkConvite` (convite-cliente)
- `NovaDeclaracaoModal` / hook de criar declaração (nova-declaracao)
- Fluxo de transmissão (declaracao-transmitida)
- `CobrancaModal` / cron de cobrança (cobranca-vencendo, cobranca-paga)
- `LembreteEnvioModal` / `enviar-lembretes-prazo` (envio-manual-declaracao, lembrete-prazo-ir)
- Convite de colaborador (mantém remetente DeclaraIR, pois ainda não há vínculo do convidado com escritório → **exceção**)
- Boas-vindas pós-signup do dono (mantém DeclaraIR — primeiro contato)

Onde o `escritorio_id` já existe no contexto (cliente, declaração, cobrança), passamos direto. Em jobs server-side (cron de cobrança/lembretes) busca-se via join com `clientes`/`declaracoes`.

### 4. Templates — sem alteração estrutural
Os templates já recebem `nomeEscritorio` como prop e mostram no corpo/assinatura. A mudança é apenas no header "De".

## O que NÃO muda
- Domínio de envio continua `notifica.declarair.com.br` (verificado).
- Logo/branding interno dos emails já é dinâmico via `siteName`/`escritorio` (whitelabel existente).
- Nenhuma alteração de DNS ou de domínio do cliente.

## Limitação importante a comunicar
Não é possível enviar de `@dominiodoescritorio.com.br` sem que cada escritório configure DNS próprio. Isso seria um recurso whitelabel premium futuro (requer verificação de domínio por escritório). O nome amigável + Reply-To resolve ~90% do problema de reconhecimento sem essa complexidade.

## Validação
1. Disparar convite-cliente de um escritório de teste → verificar no Gmail que aparece o nome do escritório no "De".
2. Clicar em "Responder" → confirmar que o destinatário é o email do escritório.
3. Verificar que emails sem `escritorioId` (boas-vindas, convite colaborador) ainda saem como "DeclaraIR".
