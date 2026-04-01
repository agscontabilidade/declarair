import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const faqs = [
  { q: 'Como funciona o plano gratuito?', a: 'O plano Free libera 1 declaração completa com chat, kanban e 500 MB de armazenamento — ideal para conhecer a plataforma sem compromisso.' },
  { q: 'Qual a diferença entre Free e Pro?', a: 'O Pro (R$ 29,90/mês) inclui 3 declarações, até 5 usuários, armazenamento ilimitado, monitoramento de malha fina, calculadora de IR e suporte prioritário. Declarações extras saem por R$ 9,90 cada.' },
  { q: 'Meus dados e os dos meus clientes estão seguros?', a: 'Sim. Utilizamos criptografia, banco de dados isolado por escritório e controle de acesso em nível de linha (RLS) em todas as tabelas, em conformidade com a LGPD.' },
  { q: 'Meus clientes precisam instalar algo?', a: 'Não. O portal do cliente é 100% web — funciona em qualquer celular ou computador. Basta enviar o link de convite.' },
  { q: 'O que são os Recursos Extras?', a: 'Módulos opcionais que ampliam a plataforma: integração com WhatsApp (R$ 19,90/mês), API Pública (R$ 29,90/mês) e Whitelabel com sua marca (R$ 49,90/mês).' },
  { q: 'Existe contrato de fidelidade?', a: 'Não. A cobrança é mensal e você pode cancelar a qualquer momento, sem multa e sem burocracia.' },
];

export default function FAQSection() {
  const ref = useScrollReveal();

  return (
    <section ref={ref} id="faq" className="v2-reveal py-20 lg:py-28 bg-[hsl(var(--lv2-slate-50))]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 text-xs px-3 py-1 font-medium border-[hsl(var(--lv2-slate-200))]">
            FAQ
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[hsl(var(--lv2-slate-950))]">
            Perguntas diretas, respostas diretas
          </h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-xl border border-[hsl(var(--lv2-slate-200))] bg-white px-5"
            >
              <AccordionTrigger className="text-left text-sm font-medium text-[hsl(var(--lv2-slate-950))] hover:no-underline py-4 font-heading">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-[hsl(var(--lv2-slate-500))] pb-4">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
