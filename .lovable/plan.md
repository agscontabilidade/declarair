

# Plano: Adicionar Vida à Landing Page com Pessoas e Elementos Visuais

## Conceito

Inspirado na referencia (Biru), adicionar fotos reais de pessoas usando notebooks/celulares em posicoes estrategicas, mantendo as cores e marca. Usar imagens do Unsplash (gratuitas, sem chave) via URL direta.

## Mudancas

### 1. Hero Section — Pessoa com Notebook ao Fundo do Mockup

Adicionar uma foto de profissional (contador) com notebook como background da area direita do hero, por tras dos mockups flutuantes. A pessoa fica com opacidade parcial e um gradient overlay nas cores da marca, dando contexto humano sem competir com os mockups.

```text
┌─────────────────────────────────────────────┐
│  Texto CTA          │  [Foto pessoa]        │
│  Badge IRPF 2026    │    ┌─────────┐        │
│  H1 grande          │    │ Mockup  │ float  │
│  Botoes             │    └─────────┘        │
│                     │      ┌────┐ float     │
│                     │      │KPI │           │
│                     │      └────┘           │
└─────────────────────────────────────────────┘
```

### 2. Nova Secao "Deixe o Trabalho Pesado Conosco" (Inspirada na Referencia)

Secao split com fundo primary, foto de pessoa usando celular no centro, e cards de beneficios flutuantes ao lado direito (como na referencia Biru — "Let us do the work"). Usa glassmorfismo nos cards.

```text
┌──────────────────────────────────────────────┐
│ bg-primary/95                                │
│ "Deixe a burocracia    [Foto pessoa     ┌──┐│
│  conosco. Foque no      com celular]    │📱││
│  que importa."                          └──┘│
│                                        ┌──┐ │
│ [Botao CTA]                            │💻│ │
│                                        └──┘ │
└──────────────────────────────────────────────┘
```

### 3. Testimonials — Fotos Reais nos Avatares

Substituir as iniciais por fotos de pessoas profissionais (Unsplash) nos depoimentos, dando mais credibilidade.

### 4. Social Proof — Logos de "Parceiros" Placeholder

Adicionar faixa "Utilizado por +500 escritorios" com logos placeholder estilizados (usando texto/icones, sem imagens externas), similar a referencia.

### 5. CTA Final — Background com Pessoa

Adicionar imagem sutil de contador satisfeito no background do CTA final, com overlay gradient mantendo legibilidade.

## Imagens (Unsplash — gratuitas)

Usar URLs diretas do Unsplash para fotos profissionais:
- Hero: Homem com notebook (business/tech)
- Secao split: Pessoa com celular
- Testimonials: 3 fotos de profissionais
- CTA: Profissional sorrindo

## Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| `src/pages/Index.tsx` | Adicionar secao split com pessoa, fotos nos testimonials, imagem no hero e CTA |
| `src/components/landing/HeroMockup.tsx` | Adicionar foto de pessoa como background por tras dos mockups |

Nenhum arquivo novo. Apenas enriquecimento visual com imagens estrategicas de pessoas.

