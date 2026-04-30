import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Section } from './LandingSection';
import { faqs } from './LandingData';

export const LandingFAQ = () => (
  <Section id="faq" className="py-20 lg:py-28">
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <Badge variant="outline" className="mb-4 text-xs px-3 py-1 font-medium">FAQ</Badge>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Perguntas diretas, respostas diretas</h2>
      </div>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-border bg-card px-5">
            <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-4">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-4">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </Section>
);
