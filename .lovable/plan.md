

# Plano: Aplicar Marca Correta + Tipografia Poppins

## O Que Está Errado Hoje

1. **Logo pequeno demais** — `h-8 w-8` (32px) na sidebar, header, etc.
2. **Nome "DeclaraIR" é texto** — deveria ser a imagem da wordmark (image-14.png) em todos os lugares
3. **Tipografia errada** — usa DM Sans (body) e Syne (headings), precisa ser **Poppins** em tudo

## Mudanças

### 1. Copiar Assets da Marca

- `image-16.png` → `src/assets/logo-icon.png` (ícone "D" com seta, quadrado, para sidebar collapsed/favicon)
- `image-14.png` → `src/assets/logo-full.png` (wordmark "DeclaraIR" texto)
- `image-13.png` → `src/assets/logo-hero.png` (logo 3D grande para landing page hero)
- `image-16.png` → `public/favicon.png` (favicon)

### 2. Tipografia Global → Poppins

**`src/index.css`**: Trocar import do Google Fonts para Poppins (300-800). Remover DM Sans e Syne. Body e headings usam Poppins.

**`tailwind.config.ts`**: Trocar `fontFamily.display` e `fontFamily.body` para Poppins.

A classe `font-display` continua existindo mas agora aponta para Poppins (weight 600-800 para headings).

### 3. Aplicar Logo nos Componentes

| Local | Antes | Depois |
|-------|-------|--------|
| **Sidebar** header | icon 32px + texto "DeclaraIR" | icon **40px** + wordmark img **h-7** |
| **Landing** header | icon 32px + texto | icon **36px** + wordmark img **h-7** |
| **Landing** footer | icon 24px + texto | icon **28px** + wordmark img **h-5** |
| **Landing** hero | sem logo grande | adicionar `logo-hero.png` **h-24** acima do título |
| **Login** | logo-full 48px | wordmark img **h-10** |
| **Cadastro** desktop | icon 36px + texto | icon **44px** + wordmark img **h-8** |
| **Cadastro** mobile | icon 32px + texto | icon **40px** + wordmark img **h-7** |
| **Onboarding** header | icon 32px + texto | icon **40px** + wordmark img **h-7** |

Em todos os locais, **remover o `<span>DeclaraIR</span>`** e substituir por `<img src={logoFull} className="h-7" />` (a wordmark real da marca).

### 4. Arquivos Modificados

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Font import → Poppins, body/headings font-family |
| `tailwind.config.ts` | fontFamily.display e .body → Poppins |
| `src/assets/logo-icon.png` | Substituir pelo image-16 |
| `src/assets/logo-full.png` | Substituir pelo image-14 (wordmark) |
| `src/assets/logo-hero.png` | Novo — image-13 (3D grande) |
| `public/favicon.png` | Substituir pelo image-16 |
| `src/components/layout/Sidebar.tsx` | Logo maior + wordmark img |
| `src/pages/Index.tsx` | Logo maior + wordmark em header/footer + hero logo |
| `src/pages/Login.tsx` | Wordmark maior |
| `src/pages/Cadastro.tsx` | Logo + wordmark maiores |
| `src/pages/Onboarding.tsx` | Logo + wordmark maiores |
| `src/pages/RedefinirSenha.tsx` | Trocar ícone por logo real |

