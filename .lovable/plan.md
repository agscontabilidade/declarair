

# Plano: Onboarding Guiado para Contadores (Cadastro + Configuração Inicial)

## Visao Geral

Transformar o fluxo atual de cadastro (um formulario simples em Login.tsx) em um wizard completo de 3 etapas no cadastro + 4 etapas de configuracao inicial pos-login, inspirado no concorrente mas superior.

O contador NAO acessa o dashboard ate completar o onboarding. Um campo `onboarding_completo` na tabela `escritorios` controla isso.

## Arquitetura do Fluxo

```text
Landing Page → /cadastro (wizard 3 steps) → Login → /onboarding (wizard 4 steps) → Dashboard

CADASTRO (/cadastro):
  Step 1: Dados pessoais (nome, email, telefone, CPF, senha)
  Step 2: Escolha do plano (cards selecionaveis, popup upsell ao escolher gratis)
  Step 3: Revisao + Criar Conta

ONBOARDING (/onboarding) — pos-login, modal fullscreen:
  Step 1: Bem-vindo — overview do que sera configurado
  Step 2: Perfil — foto do contador (upload avatar)
  Step 3: Dados da Empresa — razao social*, CNPJ*, nome fantasia, email, telefone, whatsapp, chave PIX, endereco completo (CEP, logradouro, numero, complemento, bairro, cidade, UF), logo
  Step 4: Identidade Visual — cores e whitelabel (simplificado)

  * Razao social e CNPJ sao obrigatorios — nao avanca sem preencher.
```

## Mudancas no Banco de Dados

**Migration**: Adicionar coluna `onboarding_completo` (boolean default false) + campos de endereco na tabela `escritorios`:
- `onboarding_completo` boolean default false
- `razao_social` text
- `nome_fantasia` text
- `whatsapp` text
- `chave_pix` text
- `endereco_cep` text
- `endereco_logradouro` text
- `endereco_numero` text
- `endereco_complemento` text
- `endereco_bairro` text
- `endereco_cidade` text
- `endereco_uf` text

Adicionar campo `telefone` e `avatar_url` na tabela `usuarios`.

## Arquivos a Criar

1. **`src/pages/Cadastro.tsx`** — Wizard de 3 steps com layout split (ilustracao a esquerda, formulario a direita). Stepper visual (Dados → Plano → Pagamento). Inclui:
   - Step 1: nome, email, telefone, CPF do contador, senha
   - Step 2: Cards de plano selecionaveis (Gratuito, Start, Profissional, Enterprise). Ao selecionar Gratuito e clicar Continuar, popup Dialog "Antes de continuar..." induzindo upgrade ao Profissional com timer e beneficios
   - Step 3: Resumo dos dados + plano selecionado com botoes "Editar" e "Alterar". Botao "Criar Conta Gratis" / "Assinar [Plano]"

2. **`src/pages/Onboarding.tsx`** — Modal fullscreen (Dialog sem fechar) com 4 steps e barra de progresso. Header com logo DeclaraIR + "Configuracao Inicial" + "Passo X de 4". Inclui:
   - Step 1: Boas-vindas com overview das etapas (Perfil, Empresa, Identidade)
   - Step 2: Upload de foto de perfil (avatar circular com dashed border + botao "Subir Foto")
   - Step 3: Dados da empresa (logo, razao social*, nome fantasia, CNPJ*, email, telefone, whatsapp, chave PIX, endereco completo). Validacao: nao avanca sem razao social e CNPJ. Toast de erro se tentar avancar sem
   - Step 4: Cores primarias e finalizacao. Botao "Concluir e Acessar o Dashboard"

3. **`src/components/cadastro/UpsellModal.tsx`** — Dialog "Antes de continuar..." com beneficios do plano Profissional, timer de oferta, botoes "Assinar o Profissional" e "Continuar com o gratis"

## Arquivos a Modificar

1. **`src/App.tsx`** — Adicionar rota `/cadastro` e `/onboarding`
2. **`src/pages/Login.tsx`** — Remover aba "Criar Conta", adicionar link "Criar conta" apontando para `/cadastro`
3. **`src/contexts/AuthContext.tsx`** — Carregar `onboarding_completo` do escritorio no profile
4. **`src/components/ProtectedRoute.tsx`** — Se `onboarding_completo === false`, redirecionar para `/onboarding` ao inves do dashboard
5. **`src/pages/Index.tsx`** — Trocar links de "Comecar Gratis" de `/login` para `/cadastro`

## Design

- Layout split: lado esquerdo cinza claro com ilustracao line-art + texto motivacional ("Comece sua jornada"), lado direito branco com formulario
- Stepper circular no topo (numeros com check quando completado, linha conectando)
- Cards de plano com borda highlight verde quando selecionado, badge "Popular" no Profissional
- Onboarding como overlay fullscreen branco (sem sidebar), nao permite fechar
- Botoes primarios verde escuro (#3d5a50) seguindo o padrao do concorrente

## Logica de Bloqueio

No `ProtectedRoute`, apos autenticar como contador:
- Buscar `escritorios.onboarding_completo` via query
- Se `false`, redirecionar para `/onboarding`
- No step 3 do onboarding, validar razao_social e cnpj antes de avancar
- Ao concluir step 4, setar `onboarding_completo = true` e redirecionar ao dashboard

## Resumo de Entregas

| Entrega | Arquivo | Tipo |
|---------|---------|------|
| Migration DB | migration SQL | Novo |
| Wizard de Cadastro | `src/pages/Cadastro.tsx` | Novo |
| Modal Upsell | `src/components/cadastro/UpsellModal.tsx` | Novo |
| Wizard Onboarding | `src/pages/Onboarding.tsx` | Novo |
| ProtectedRoute bloqueio | `src/components/ProtectedRoute.tsx` | Editar |
| AuthContext + profile | `src/contexts/AuthContext.tsx` | Editar |
| Login simplificado | `src/pages/Login.tsx` | Editar |
| Rotas + links | `src/App.tsx`, `src/pages/Index.tsx` | Editar |

