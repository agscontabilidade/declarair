## Escopo: tooltips no portal do cliente (`/cliente/*`)

Adicionar tooltips informativos onde a UI hoje depende só de ícone/badge ou usa termo técnico do IRPF. **Não** mexer em lógica, dados, rotas ou no design — só envolver elementos existentes com `<Tooltip>`.

`TooltipProvider` já está montado globalmente em `App.tsx` (linha 111). Não precisa reconfigurar.

---

### Áreas que vão receber tooltip

**1. `ClienteLayout.tsx` (sidebar + topbar)**
- Itens do menu lateral (quando colapsado em mobile/icon-only).
- Sino de notificações → "Notificações".
- Toggle de tema → "Alternar tema claro/escuro".
- Botão de logout → "Sair da conta".
- Logo do escritório → nome completo do escritório (quando truncado).

**2. `ClienteDashboard.tsx`**
- Os 3 cards de status (Informações Cadastrais, Envio de Documentos, Resultado Final) ganham tooltip nos badges explicando o que significa cada estado (Pendente / Em andamento / Preenchido / Aguardando transmissão / Restituição / Imposto a pagar).
- Botão "Ver Passo a Passo" do card e-CAC → "Tutorial completo para cadastrar procuração no portal e-CAC da Receita Federal".
- Ícone `ShieldCheck` do card e-CAC → "Procuração eletrônica permite que seu contador acompanhe sua declaração em tempo real".

**3. `StatusStepper.tsx`**
- Cada bolinha das 5 etapas vira `TooltipTrigger` com descrição:
  - Dados Cadastrais → "Preencha suas informações pessoais e fiscais"
  - Enviar Documentos → "Anexe comprovantes, informes e documentos da Receita"
  - Documentação Recebida → "Seu contador confirmou o recebimento dos documentos"
  - Declaração Pronta → "Declaração revisada e pronta para transmissão à Receita"
  - Transmitida → "Declaração entregue à Receita Federal"
- Quando houver timestamp, mostrar também no tooltip ("Concluída em dd/MM/yyyy HH:mm").

**4. `ClienteDocumentos.tsx`**
- Botão "Ver lista de documentos" → "Lista completa por categoria fiscal: rendimentos, deduções, bens, etc."
- Botão "Enviar ao Contador" → "Finaliza o envio. Após isso, novos uploads serão notificados ao seu contador".
- Badge "Enviado ao Contador" → "Documentos já foram entregues ao seu contador para análise".
- Ícone lixeira → "Excluir documento" (em vez de só ícone).
- Zona de upload (ícone Upload) → "Aceitamos PDF, imagens, DOC, XLS até 20MB por arquivo".
- Contador "X arquivo(s) anexado(s)" → "Total de documentos já enviados nesta declaração".

**5. `ClienteFormulario.tsx` + steps**
Foco em termos fiscais que o leigo não entende. Adicionar tooltip ao lado do label (ícone `HelpCircle` discreto, `text-muted-foreground hover:text-foreground`):
- **StepDadosPessoais:** Estado civil ("Situação no último dia do ano-base"), Dependentes ("Pessoas que dependem economicamente — exigem CPF").
- **StepDependentes:** "Dependentes reduzem o imposto em R$ 189,59/ano cada, mas seus rendimentos também são somados aos seus".
- **StepRendimentos** (emprego, autônomo, aluguel, outros): "Use o valor bruto anual do informe de rendimentos da fonte pagadora".
- **StepBens:** "Informe o valor de aquisição, não o valor de mercado atual".
- **StepDividas:** "Apenas dívidas acima de R$ 5.000 em 31/12 são obrigatórias".
- **StepDeducoes:**
  - Saúde → "Sem limite de dedução. Exige nota fiscal/recibo com CPF/CNPJ do prestador".
  - Educação → "Limite de R$ 3.561,50 por pessoa/ano. Só cursos regulares".
  - Previdência → "PGBL: limite de 12% da renda tributável. VGBL não deduz".
- **StepInfoAdicionais:** Chave Pix → "Pix vinculado ao seu CPF para receber restituição automaticamente".
- **StepPerfilFiscal:** cada uma das 11 perguntas binárias ganha tooltip curto explicando o critério.
- Botões "Salvar e continuar" / "Voltar" / "Concluir" → tooltips quando desabilitados explicando o porquê ("Preencha os campos obrigatórios antes de continuar").

**6. `ChatFlutuante.tsx`**
- Botão flutuante → "Fale com seu contador".
- Indicador de mensagens não lidas → "X mensagens não lidas".

---

### Padrão técnico

Criar um helper leve para reduzir boilerplate:

```tsx
// src/components/cliente-portal/InfoTooltip.tsx (novo, ~25 linhas)
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function InfoTooltip({ children, side = 'top' }: { children: React.ReactNode; side?: 'top'|'right'|'bottom'|'left' }) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[260px] text-xs leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
```

Para wrappers em elementos existentes (botões, ícones), usar o `Tooltip` direto importado de `@/components/ui/tooltip` envolvendo o elemento com `TooltipTrigger asChild`.

---

### Arquivos tocados
- `src/components/cliente-portal/InfoTooltip.tsx` (novo)
- `src/components/layout/ClienteLayout.tsx`
- `src/pages/cliente/ClienteDashboard.tsx`
- `src/components/cliente-portal/StatusStepper.tsx`
- `src/pages/cliente/ClienteDocumentos.tsx`
- `src/pages/cliente/ClienteFormulario.tsx`
- `src/components/formulario-ir/StepDadosPessoais.tsx`
- `src/components/formulario-ir/StepDependentes.tsx`
- `src/components/formulario-ir/StepDocumentos.tsx` (somente se reusado no portal)
- `src/components/formulario-ir/StepPerfilFiscal.tsx`
- `src/components/formulario-ir/StepInfoAdicionais.tsx`
- `src/components/cliente-portal/ChatFlutuante.tsx`

### Fora de escopo
- Qualquer mudança em lógica, validação, RLS, schema.
- Área do contador, admin, landing.
- Redesign visual dos componentes — só adicionar tooltips.
- Criar novos textos legais/fiscais inventados: vou usar exatamente as regras já estabelecidas na memória (`IRPF Rules`, `Tax Engine`).

### Pergunta em aberto
Se preferir, posso restringir a primeira leva apenas a **Dashboard + Documentos + Stepper + Layout** (maior impacto, menos arquivos) e deixar o formulário (que tem muitos campos) numa segunda etapa. Caso contrário, sigo com tudo de uma vez.
