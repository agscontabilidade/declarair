import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User, Users, Heart, Briefcase, Receipt, Home,
  TrendingUp, FileWarning, CheckCircle2, AlertCircle, CalendarClock,
} from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OBRIGATORIEDADE = [
  { titulo: 'Rendimentos tributáveis', valor: 'Acima de R$ 35.584,00', desc: 'Total anual recebido em 2025.' },
  { titulo: 'Rendimentos isentos / exclusivos', valor: 'Acima de R$ 200.000,00', desc: 'Isentos, não tributáveis ou tributados na fonte.' },
  { titulo: 'Operações em bolsa', valor: 'Acima de R$ 40.000,00', desc: 'Movimentação ou apuração de ganho tributável.' },
  { titulo: 'Ganho de capital', valor: 'Obrigatório', desc: 'Venda de bens ou direitos com lucro.' },
  { titulo: 'Atividade rural', valor: 'Acima de R$ 177.920,00', desc: 'Receita bruta anual superior a esse limite.' },
  { titulo: 'Patrimônio em 31/12/2025', valor: 'Acima de R$ 800.000,00', desc: 'Bens e direitos somando esse montante.' },
  { titulo: 'Residência no Brasil', valor: 'Obrigatório', desc: 'Passou à condição de residente em 2025.' },
];

const CATEGORIAS = [
  {
    id: 'dados',
    label: '1. Dados cadastrais',
    icon: User,
    color: 'text-primary',
    bg: 'bg-primary/10',
    items: [
      'Nome completo, CPF e data de nascimento',
      'Título de eleitor',
      'Telefone e e-mail atualizados',
      'Endereço atualizado',
      'Procuração eletrônica, por meio de acesso com senha gov.br',
    ],
  },
  {
    id: 'dependentes',
    label: '2. Dependentes',
    icon: Users,
    color: 'text-accent-foreground',
    bg: 'bg-accent',
    items: [
      'Nome completo, CPF, data de nascimento e grau de parentesco',
      'Informes de rendimentos e comprovantes de despesas dos dependentes, quando houver',
    ],
  },
  {
    id: 'alimentandos',
    label: '3. Alimentandos (pensão alimentícia)',
    icon: Heart,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    items: [
      'Nome completo',
      'CPF',
      'Data de nascimento',
      'Cópia da escritura pública, acordo homologado judicialmente ou decisão judicial que estabeleça a pensão alimentícia',
    ],
  },
  {
    id: 'rendimentos',
    label: '4. Comprovantes de rendimentos',
    icon: Briefcase,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    items: [
      'Informes de rendimentos de salários, pró-labore, aposentadoria, pensão e demais rendas recebidas',
      'Informes de rendimentos bancários e de aplicações financeiras',
      'Informes de rendimentos de corretoras e investimentos',
      'Informes de rendimentos de aluguéis, se houver',
      'Demais comprovantes de rendimentos recebidos no ano de 2025',
    ],
  },
  {
    id: 'despesas',
    label: '5. Despesas e pagamentos',
    icon: Receipt,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    items: [
      'Comprovantes de despesas médicas e odontológicas',
      'Comprovantes de despesas com plano de saúde',
      'Comprovantes de despesas com educação',
      'Comprovantes de previdência privada',
      'Comprovantes de pensão alimentícia, se houver',
      'Comprovantes de pagamentos efetuados a profissionais e prestadores de serviços',
    ],
  },
  {
    id: 'bens',
    label: '6. Bens e direitos',
    icon: Home,
    color: 'text-warning',
    bg: 'bg-warning/10',
    items: [
      'Documentos de aquisição e venda de veículos, imóveis e quaisquer outros bens',
      'Sempre que houver compra ou venda, informar dados de comprador/vendedor (nome, CPF/CNPJ e forma de pagamento)',
      'Contrato de financiamento, quando houver',
      'Informe de rendimentos ou demonstrativo da instituição financeira com valores pagos em 2025 (financiamentos)',
      'Documentos relativos à participação societária em empresas',
      'Em caso de herança: formal de partilha, escritura pública de inventário e partilha ou carta de adjudicação',
    ],
  },
  {
    id: 'investimentos',
    label: '7. Investimentos (ações e criptoativos)',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    items: [
      'Notas de corretagem de todo o ano de 2025',
      'Relatório ou extrato de posição em custódia em 31/12/2025',
      'Informes de rendimentos das corretoras',
      'Comprovantes de DARFs pagos, se houver',
      'Criptoativos: informes de rendimentos, se houver',
      'Criptoativos: relatório de negociações (extrato fiscal) de 2025',
      'Criptoativos: extratos das corretoras e/ou carteiras digitais',
    ],
  },
  {
    id: 'dividas',
    label: '8. Dívidas e ônus',
    icon: FileWarning,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    items: [
      'Contratos de empréstimos, financiamentos e demais obrigações assumidas',
      'Identificação do credor, com nome e CPF ou CNPJ',
      'Demonstrativo do saldo devedor em 31/12/2025',
      'Comprovantes ou demonstrativo dos pagamentos efetuados em 2025',
    ],
  },
];

export function RelacaoDocumentosModal({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Relação de Documentos – IRPF 2026
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 pt-1">
            <CalendarClock className="h-4 w-4 text-primary" />
            Prazo legal para entrega da declaração:{' '}
            <Badge variant="outline" className="border-primary/40 text-primary font-medium">
              29/05/2026
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Quem está obrigado */}
          <section>
            <h3 className="font-display text-base font-semibold mb-3">
              Quem está obrigado a declarar?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Se, em 2025, você se enquadrou em uma das situações abaixo:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OBRIGATORIEDADE.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-lg border bg-card p-3 hover:border-primary/40 transition-colors"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    {item.titulo}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-1">{item.valor}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Categorias de documentos */}
          <section>
            <h3 className="font-display text-base font-semibold mb-3">
              Documentos por categoria
            </h3>
            <Accordion type="multiple" className="space-y-2">
              {CATEGORIAS.map((cat) => {
                const Icon = cat.icon;
                return (
                  <AccordionItem
                    key={cat.id}
                    value={cat.id}
                    className="border rounded-lg px-4 bg-card"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 text-left">
                        <div className={`h-9 w-9 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4 w-4 ${cat.color}`} />
                        </div>
                        <span className="text-sm font-medium">{cat.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pl-12 pb-2">
                        {cat.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>

          {/* Observações finais */}
          <section className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">Observações importantes</h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>
                    Receberemos documentação somente até{' '}
                    <strong className="text-foreground">18/05/2026</strong>.
                  </li>
                  <li>
                    Restituição via Pix é possível apenas se a chave cadastrada for o{' '}
                    <strong className="text-foreground">número do CPF</strong>.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-primary hover:bg-primary/90">
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
