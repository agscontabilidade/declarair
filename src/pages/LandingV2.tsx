import NavBar from '@/components/landing-v2/NavBar';
import HeroSection from '@/components/landing-v2/HeroSection';
import StorytellingBand from '@/components/landing-v2/StorytellingBand';
import PainSection from '@/components/landing-v2/PainSection';
import TurningPoint from '@/components/landing-v2/TurningPoint';
import ProductShowcase from '@/components/landing-v2/ProductShowcase';
import BeforeAfter from '@/components/landing-v2/BeforeAfter';
import FeaturesGrid from '@/components/landing-v2/FeaturesGrid';
import HowItWorks from '@/components/landing-v2/HowItWorks';
import FeatureShowcases from '@/components/landing-v2/FeatureShowcases';
import TestimonialsSection from '@/components/landing-v2/TestimonialsSection';
import ObjectionsSection from '@/components/landing-v2/ObjectionsSection';
import PricingSection from '@/components/landing-v2/PricingSection';
import UrgencyBand from '@/components/landing-v2/UrgencyBand';
import FAQSection from '@/components/landing-v2/FAQSection';
import CTAFinal from '@/components/landing-v2/CTAFinal';
import Footer from '@/components/landing-v2/Footer';
import { CookieConsent } from '@/components/landing/CookieConsent';
import { SEO } from '@/components/SEO';
import { faqs } from '@/components/landing/LandingData';

const BASE = 'https://declarair.com.br';

const homeJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'DeclaraIR',
    url: BASE,
    logo: `${BASE}/favicon.png`,
    sameAs: [],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DeclaraIR',
    url: BASE,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
];

export default function LandingV2() {
  return (
    <div className="landing-v2 min-h-screen overflow-x-hidden">
      <SEO
        title="DeclaraIR — Gestão de IRPF para escritórios de contabilidade"
        description="Acabe com o caos do IR: Kanban, portal do cliente, WhatsApp automático e Drive organizado. Comece grátis, sem cartão."
        path="/"
        jsonLd={homeJsonLd}
      />
      <NavBar />
      <HeroSection />
      <StorytellingBand />
      <PainSection />
      <TurningPoint />
      <ProductShowcase />
      <BeforeAfter />
      <FeaturesGrid />
      <HowItWorks />
      <FeatureShowcases />
      <TestimonialsSection />
      <ObjectionsSection />
      <PricingSection />
      <UrgencyBand />
      <FAQSection />
      <CTAFinal />
      <Footer />
      <CookieConsent />
    </div>
  );
}
