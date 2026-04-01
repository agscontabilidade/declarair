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

export default function LandingV2() {
  return (
    <div className="landing-v2 min-h-screen overflow-x-hidden">
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
    </div>
  );
}
