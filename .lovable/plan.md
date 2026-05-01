## Objetivo

Em `/cliente/documentos`, no topo da tela, exibir um card de ajuda informando que o cliente pode consultar a lista completa de documentos necessários. Ao clicar no botão, abrir um modal com a relação detalhada extraída do PDF anexado, organizada por categorias, respeitando nosso design system (Bricolage Grotesque, DM Sans, verde Emerald, glassmorphism, cards com radius 10px).

## Arquivos afetados

1. **Novo**: `src/components/cliente-portal/RelacaoDocumentosModal.tsx` — componente do modal com a lista completa.
2. **Editado**: `src/pages/cliente/ClienteDocumentos.tsx` — adicionar o card de ajuda no topo (antes do header existente ou logo abaixo) com botão que abre o modal.

## Conteúdo do Card de Ajuda (topo da página)

- **Layout**: Card horizontal com glassmorphism sutil (border-primary/20, bg-primary/5), ícone `HelpCircle` ou `FileQuestion` à esquerda em círculo verde, texto à direita e botão CTA "Ver lista completa".
- **Título**: "Não sabe quais documentos enviar?"
- **Descrição**: "Consulte a relação completa de documentos necessários para sua declaração de IRPF 2026, organizada por categoria."
- **Botão**: `Button` variant default verde primary com ícone `FileText` — "Ver lista de documentos".
- Posicionado **acima** do header "Documentos / Gerencie e envie...".

## Conteúdo do Modal (`RelacaoDocumentosModal`)

Componente baseado em `Dialog` do shadcn, `max-w-3xl`, `max-h-[85vh] overflow-y-auto`.

### Header do modal
- Título: "Relação de Documentos – IRPF 2026" (font-display)
- Subtítulo: "Prazo legal para entrega: 29/05/2026"
- Badge informativo destacando o prazo

### Bloco "Quem está obrigado a declarar"
Grid 2 colunas (md:grid-cols-2) com cards pequenos contendo cada critério extraído do PDF:
- Rendimentos tributáveis acima de **R$ 35.584,00**
- Rendimentos isentos/exclusivos acima de **R$ 200.000,00**
- Operações em bolsa acima de **R$ 40.000,00** ou ganho tributável
- Ganho de capital (venda de bens com lucro)
- Atividade rural com receita acima de **R$ 177.920,00**
- Patrimônio em 31/12/2025 acima de **R$ 800.000,00**
- Passou à condição de residente no Brasil em 2025

### Bloco "Documentos por categoria"
Accordion (`@/components/ui/accordion`) com 8 seções, cada uma com ícone e cor da categoria correspondente (mesmo `CATEGORIA_META` já usado na página). Os 8 grupos extraídos do PDF:

1. **Dados cadastrais** (User) — Nome, CPF, data de nascimento; Título de eleitor; Telefone/e-mail; Endereço; Procuração eletrônica (gov.br).
2. **Dependentes** (Users) — Dados pessoais; Informes de rendimentos e despesas.
3. **Alimentandos (pensão alimentícia)** (Heart) — Dados pessoais; Escritura/acordo/decisão judicial.
4. **Comprovantes de rendimentos** (Briefcase) — Salários, pró-labore, aposentadoria, pensão; rendimentos bancários; corretoras; aluguéis; demais rendas.
5. **Despesas / Pagamentos** (Receipt) — Despesas médicas e odontológicas; plano de saúde; educação; previdência privada; pensão alimentícia; pagamentos a profissionais.
6. **Bens e direitos** (Home) — Aquisição/venda de veículos e imóveis; dados de comprador/vendedor; financiamentos; participações societárias; herança.
7. **Investimentos (ações e criptoativos)** (TrendingUp) — Notas de corretagem; posição em custódia 31/12/2025; informes; DARFs; criptoativos (informes, relatório, extratos de carteiras).
8. **Dívidas e ônus** (FileWarning) — Contratos; identificação do credor; saldo devedor 31/12/2025; comprovantes de pagamentos.

Cada item dentro do accordion: lista com `<ul>` estilizado, marcador verde `CheckCircle2` h-4 w-4, texto `text-sm text-muted-foreground`.

### Bloco "Observações finais"
Card destacado em amarelo suave (border-warning/30 bg-warning/5) com ícone `AlertCircle`:
- "Receberemos documentação somente até **18/05/2026**"
- "Restituição via Pix: somente se a chave cadastrada for o número do CPF"

(Não incluir os dados de contato da AGS Cont — adriana@, gelson@, telefones, conforme convenção de whitelabel.)

### Footer do modal
Botão único "Entendi" que fecha o modal.

## Design / UI

- Tipografia: títulos com `font-display` (Bricolage Grotesque), corpo `font-sans` (DM Sans).
- Cores: usar tokens semânticos — `primary` (Emerald #10B981), `success`, `warning`, `muted-foreground`. Nunca cores hard-coded.
- Cards internos com `rounded-lg`, sombra suave, hover sutil.
- Ícones lucide-react já presentes no projeto.
- Responsivo: grid de 2 colunas em md+, 1 coluna no mobile; accordion full-width.
- Acessibilidade: `Dialog` shadcn já fornece foco/escape/aria.

## Estado e Lógica

- Estado local `modalOpen` em `ClienteDocumentos.tsx` controla abertura.
- Sem chamadas a backend — conteúdo 100% estático em constante exportada do componente do modal.
- Não altera nenhuma lógica de upload, RLS, status ou banco.

## Fora de escopo

- Não usar logos, contatos ou branding da AGS Cont.
- Não alterar o fluxo de upload, status_documentos, ou notificações existentes.
- Não criar nova rota — apenas modal sobre a página atual.
