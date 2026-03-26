import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, ArrowRight } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';
import logoFull from '@/assets/logo-full.png';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { PlanosHeader } from '@/components/planos/PlanosHeader';
import { ComoFunciona } from '@/components/planos/ComoFunciona';
import { PlanosCardsPublic } from '@/components/planos/PlanosCardsPublic';
import { TabelaAvulso } from '@/components/planos/TabelaAvulso';
import { ProvaSocial } from '@/components/planos/ProvaSocial';
import { GarantiaCTA } from '@/components/planos/GarantiaCTA';

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollReveal();
  return <section ref={ref} className={`scroll-reveal ${className}`}>{children}</section>;
}

export default function Planos() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 glass-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoIcon} alt="DeclaraIR" className="h-9 w-9" />
            <img src={logoFull} alt="DeclaraIR" className="h-7 hidden sm:block" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
            <Link to="/#como-funciona" className="hover:text-foreground transition-colors">Como funciona</Link>
            <Link to="/#features" className="hover:text-foreground transition-colors">Funcionalidades</Link>
            <Link to="/planos" className="text-foreground font-semibold">Preços</Link>
            <Link to="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/cadastro"><Button size="sm" className="shadow-lg shadow-accent/20">Começar Grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main>
        {/* Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-accent/8 blur-3xl animate-blob pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full bg-primary/6 blur-3xl animate-blob-delayed pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 py-16">
          <Section><PlanosHeader /></Section>
          <Section><ComoFunciona /></Section>
          <Section><PlanosCardsPublic /></Section>
          <Section><TabelaAvulso /></Section>
          <Section><ProvaSocial /></Section>
          <Section>
            <GarantiaCTA onNavigate={() => window.location.href = '/cadastro'} />
          </Section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoIcon} alt="DeclaraIR" className="h-7 w-7" />
                <img src={logoFull} alt="DeclaraIR" className="h-5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A plataforma completa para gestão de declarações IRPF.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground text-sm mb-3">Produto</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/#features" className="hover:text-foreground transition-colors">Funcionalidades</Link></li>
                <li><Link to="/planos" className="hover:text-foreground transition-colors">Preços</Link></li>
                <li><Link to="/#faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground text-sm mb-3">Empresa</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre nós</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link to="/termos-de-uso" className="hover:text-foreground transition-colors">Termos de Uso</Link></li>
                <li><Link to="/politica-de-privacidade" className="hover:text-foreground transition-colors">Privacidade</Link></li>
                <li><Link to="/politica-lgpd" className="hover:text-foreground transition-colors">LGPD</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} DeclaraIR. Todos os direitos reservados.</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Dados protegidos com criptografia
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
