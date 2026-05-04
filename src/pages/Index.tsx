import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingStorytelling } from '@/components/landing/LandingStorytelling';
import { LandingPainPoints } from '@/components/landing/LandingPainPoints';
import { LandingBridge } from '@/components/landing/LandingBridge';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingBeforeAfter } from '@/components/landing/LandingBeforeAfter';
import { LandingTestimonials } from '@/components/landing/LandingTestimonials';
import { LandingObjections } from '@/components/landing/LandingObjections';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingUrgency } from '@/components/landing/LandingUrgency';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { Section } from '@/components/landing/LandingSection';
import { Badge } from '@/components/ui/badge';
import { Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import mockupDashboard from '@/assets/mockup-dashboard.jpg';
import featureDashboard from '@/assets/feature-dashboard.jpg';
import featureMobile from '@/assets/feature-mobile.jpg';

export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LandingHeader />
      <div className="h-16" />
      <LandingHero />
      <LandingStorytelling />
      <LandingPainPoints />
      <LandingBridge />
      
      {/* Seção de Solução (Manteve aqui por ser central) */}
      <Section id="solucao" className="gradient-brand">
        <div className="py-20 lg:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 text-center lg:text-left space-y-6">
                <Badge variant="outline" className="mb-2 border-accent/30 bg-accent/10 text-accent text-xs px-4 py-1.5 font-medium rounded-full">
                  <Zap className="h-3.5 w-3.5 mr-1.5" /> Conheça o DeclaraIR
                </Badge>
                <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.15] tracking-tight">
                  O sistema que transforma o caos do IR em um{' '}
                  <span className="bg-gradient-to-r from-accent to-[hsl(170,60%,50%)] bg-clip-text text-transparent">processo previsível e lucrativo</span>.
                </h2>
                <p className="text-white/50 text-lg leading-relaxed max-w-lg">
                  Você não precisa trabalhar mais. Precisa trabalhar organizado.
                </p>
                <Link to="/cadastro">
                  <Button size="lg" variant="secondary" className="mt-2 text-base px-8 h-12 font-bold uppercase tracking-wide">
                    Começar agora <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </div>

              <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <img src={mockupDashboard} alt="Dashboard DeclaraIR" className="w-full h-auto object-cover" loading="lazy" width={1280} height={800} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <LandingBeforeAfter />
      <LandingFeatures />

      {/* Feature Showcases */}
      <Section className="gradient-brand">
        <div className="py-20 lg:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <img src={featureDashboard} alt="Dashboard de gestão de IR" className="w-full h-[320px] lg:h-[380px] object-cover" loading="lazy" width={960} height={640} />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">
                  Pare de adivinhar. Veja o que está travado.
                </h3>
                <p className="mt-4 text-base text-primary-foreground/60 leading-relaxed">
                  O Kanban mostra cada declaração como um card. Quem está parado, quem falta documento, quem está pronto. Sem ligar pro cliente pra perguntar.
                </p>
                <ul className="mt-6 space-y-3">
                  {['Drag & drop entre etapas', 'KPIs em tempo real — sem planilha', 'Filtro por urgência e responsável'].map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-primary-foreground/70">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
              <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                <div className="rounded-2xl overflow-hidden border border-white/10">
                  <img src={featureMobile} alt="Cliente enviando documentos pelo celular" className="w-full h-[320px] lg:h-[380px] object-cover" loading="lazy" width={960} height={640} />
                </div>
              </div>
              <div className="flex-1 text-center lg:text-left">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">
                  Seu cliente manda tudo certo. Sem te incomodar.
                </h3>
                <p className="mt-4 text-base text-primary-foreground/60 leading-relaxed">
                  Chega de "manda de novo", "faltou esse", "mandou no grupo errado". O portal guia o cliente, organiza os arquivos em pastas automáticas e te avisa no WhatsApp.
                </p>
                <ul className="mt-6 space-y-3">
                  {['Pastas "Enviadas pelo cliente" e "Enviados pelo contador" automáticas', 'Upload direto pelo celular com câmera', 'Notificações automáticas via WhatsApp ao mudar status'].map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-primary-foreground/70">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <LandingTestimonials />
      <LandingObjections />
      <LandingPricing />
      <LandingUrgency />
      <LandingFAQ />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
