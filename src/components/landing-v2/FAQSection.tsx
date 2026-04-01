import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
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
    <section ref={ref} id="faq" className="v2-reveal py-28 lg:py-36 bg-white relative">
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1fr,1.5fr] gap-16 lg:gap-20">
          {/* Left sticky header */}
          <div className="lg:sticky lg:top-32 lg:self-start space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(var(--lv2-slate-200))] text-[hsl(var(--lv2-slate-500))] text-xs font-semibold uppercase tracking-wide">
              <HelpCircle className="h-3.5 w-3.5" /> FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--lv2-slate-950))] leading-tight">
              Perguntas diretas,<br />
              <span className="gradient-text">respostas diretas</span>
            </h2>
            <p className="text-[hsl(var(--lv2-slate-500))] leading-relaxed">
              Sem enrolação. Se sua dúvida não estiver aqui, fale com a gente no chat.
            </p>
          </div>

          {/* Right accordion */}
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-[hsl(var(--lv2-slate-200))] bg-[hsl(var(--lv2-slate-50))] px-7 data-[state=open]:border-[hsl(var(--lv2-emerald)/0.3)] data-[state=open]:bg-white data-[state=open]:shadow-lg data-[state=open]:shadow-[hsl(var(--lv2-emerald)/0.06)] transition-all duration-300"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-[hsl(var(--lv2-slate-950))] hover:no-underline py-6">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[15px] text-[hsl(var(--lv2-slate-500))] pb-6 leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
