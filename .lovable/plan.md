

# Plano: Padronizar Login/Auth com Design do Cadastro

## Problema

A tela `/cadastro` tem layout split premium (branding esquerda + formulario direita), enquanto as demais telas de auth sao simples cards centralizados sem identidade visual forte:
- `/login` — card simples centralizado
- `/cliente/login` — card simples com icone FileText generico
- `/recuperar-senha` — card simples com icone FileText generico
- `/redefinir-senha` — card simples (ja usa logo mas sem split)
- `/cliente/convite/:token` — card simples com icone FileText generico

## Design Alvo

Todas seguirao o mesmo padrao do `/cadastro`:

```text
┌──────────────────┬────────────────────────┐
│                  │                        │
│   BRANDING       │     FORMULARIO         │
│   bg-primary     │     bg-background      │
│   gradient       │                        │
│   logo grande    │     logo (mobile)      │
│   frase          │     titulo             │
│   decorativos    │     campos             │
│   copyright      │     botoes             │
│                  │                        │
│   42% width      │     58% width          │
│   (hidden <lg)   │                        │
└──────────────────┴────────────────────────┘
```

- Lado esquerdo: `hidden lg:flex lg:w-[42%] bg-primary` com gradient, logo, frase motivacional, circulos decorativos e copyright
- Lado direito: formulario centralizado com logo mobile no topo (visivel so em mobile)
- Animacao `animate-in fade-in slide-in-from-right-4`

## Mudancas por Arquivo

### 1. `src/pages/Login.tsx`
- Remover layout card centralizado
- Adicionar split layout identico ao Cadastro
- Lado esquerdo: logo + frase "Gerencie declaracoes IRPF com eficiencia"
- Lado direito: formulario de login com animacao

### 2. `src/pages/cliente/ClienteLogin.tsx`
- Mesmo split layout
- Lado esquerdo: frase "Acesse seus documentos e declaracoes"
- Trocar `FileText` por logo real (logo-icon + logo-full)

### 3. `src/pages/RecuperarSenha.tsx`
- Mesmo split layout
- Lado esquerdo: frase "Vamos te ajudar a recuperar o acesso"
- Trocar `FileText` por logo real
- Manter logica do estado `enviado`

### 4. `src/pages/RedefinirSenha.tsx`
- Mesmo split layout
- Lado esquerdo: frase "Defina sua nova senha com seguranca"
- Manter logica de recovery/checking

### 5. `src/pages/cliente/ConviteCliente.tsx`
- Mesmo split layout
- Lado esquerdo: frase "Bem-vindo ao portal do seu contador"
- Trocar `FileText` por logo real
- Manter logica de loading/cliente invalido

## Estrutura Reutilizada (copiar do Cadastro)

Cada pagina tera a mesma estrutura de branding no lado esquerdo:
```tsx
<div className="hidden lg:flex lg:w-[42%] bg-primary relative flex-col justify-between p-10 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/30" />
  <div className="absolute top-20 -right-20 w-72 h-72 rounded-full border border-primary-foreground/10" />
  <div className="absolute bottom-32 -left-16 w-56 h-56 rounded-3xl border border-primary-foreground/10 rotate-12" />
  <div className="relative z-10">
    <img logo-icon h-11 + logo-full h-8 brightness-0 invert />
  </div>
  <div className="relative z-10 space-y-6">
    <h2>Frase contextual</h2>
    <p>Subtitulo contextual</p>
    <CheckCircle2 + beneficio />
  </div>
  <p copyright />
</div>
```

## Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| `src/pages/Login.tsx` | Reescrever com split layout |
| `src/pages/cliente/ClienteLogin.tsx` | Reescrever com split layout |
| `src/pages/RecuperarSenha.tsx` | Reescrever com split layout |
| `src/pages/RedefinirSenha.tsx` | Reescrever com split layout |
| `src/pages/cliente/ConviteCliente.tsx` | Reescrever com split layout |

Nenhum arquivo novo. Nenhuma mudanca de logica — apenas visual.

