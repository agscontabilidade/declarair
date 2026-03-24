

# Plano: Landing Page Premium — Redesign Completo

## Conceito

Reescrever `src/pages/Index.tsx` inteiramente, inspirado nos dois designs de referencia (Base e Apptek), misturando:
- **Layout split hero** (texto esquerda + mockups flutuantes direita) como Base
- **Formas organicas e floating badges** como Apptek
- **Glassmorfismo** em cards, navbar e elementos flutuantes
- **Animacoes CSS suaves** (float, fade-in on scroll, parallax leve)
- **Screenshots reais do sistema** (dashboard, kanban, chat) como mockups no hero e secoes

## Estrutura das Secoes

```text
1. HEADER — glassmorfismo (bg-white/70 backdrop-blur-xl), logo maior, nav suave
2. HERO — split layout:
   - Esquerda: badge "Temporada IRPF 2026", h1 grande, subtitulo, 2 botoes (CTA primario + ghost)
   - Direita: composicao de mockups flutuantes (screenshot do dashboard em card glass + mini cards com metricas flutuando ao redor com animacao float)
   - Background: gradient mesh sutil com blobs animados (accent/primary)
3. SOCIAL PROOF BAR — logos de parceiros/midias em faixa com gradiente accent
4. SECAO "COMO FUNCIONA" — layout alternado (imagem esquerda + texto direita, depois inverte):
   - Bloco 1: Screenshot do Kanban + texto "Organize todas as declaracoes"
   - Bloco 2: Texto + Screenshot do Portal do Cliente
   - Cada bloco com bullet points com icone check accent
   - Cards com glassmorfismo (bg-white/60 backdrop-blur)
5. FEATURES GRID — 6 cards com glassmorfismo, icone em circulo gradient, hover com scale + shadow
6. METRICAS — fundo gradient primary, numeros grandes animados (counter), glass cards
7. TESTIMONIALS — cards glass com foto avatar, estrelas, quote
8. PRICING — igual atual mas com glassmorfismo nos cards
9. FAQ — igual atual
10. CTA FINAL — gradient accent->primary, botao grande
11. FOOTER — mais completo com colunas (Produto, Empresa, Legal)
```

## Tecnicas Visuais

### Glassmorfismo
- Navbar: `bg-white/70 backdrop-blur-xl border-b border-white/20`
- Feature cards: `bg-white/60 backdrop-blur-lg border border-white/30 shadow-xl`
- Floating badges: `bg-white/80 backdrop-blur-md rounded-2xl shadow-lg`

### Animacoes CSS (em `src/index.css`)
- `@keyframes float` — translateY sutil 6px, 3s infinite (para mockups)
- `@keyframes float-delayed` — mesmo mas com delay
- `@keyframes blob` — scale e translate suaves em blobs de fundo
- `@keyframes counter` — para numeros das metricas
- Intersection Observer hook para fade-in on scroll nos blocos

### Mockups do Sistema
- Capturas de tela renderizadas como `<div>` estilizados (nao imagens), simulando:
  - Dashboard com KPI cards e grafico de barras
  - Kanban com colunas e cards coloridos
  - Chat com baloes de mensagem
- Envoltos em glass cards com sombra e rotacao leve (perspective + rotateY)

### Elementos Decorativos
- Blobs gradient (accent/primary) com blur grande no background do hero
- Circulos e dots decorativos flutuando (como Apptek)
- Linhas de grid sutis no fundo (como Base)

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/Index.tsx` | Reescrever completo |
| `src/index.css` | Adicionar keyframes (float, blob, fade-in-up) e classes glass |
| `src/hooks/useScrollReveal.ts` | Novo — hook com IntersectionObserver para animar elementos ao scroll |

## Componentes Internos ao Index.tsx

Para manter organizado, o arquivo tera componentes inline:
- `HeroMockup` — composicao de cards simulando telas do sistema
- `FeatureShowcase` — bloco alternado imagem+texto
- `MetricCounter` — numero animado com contagem
- `GlassCard` — wrapper reutilizavel com glassmorfismo

## Dados Mantidos

Todos os arrays de dados (features, plans, faqs, testimonials, metrics) permanecem iguais. Apenas o layout e visual mudam.

