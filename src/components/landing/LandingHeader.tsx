import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import logoFull from '@/assets/logo-full.png';

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-navbar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logoFull} alt="DeclaraIR" className="h-12 sm:h-14 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
          <a href="#dor" className="hover:text-foreground transition-colors">A Dor</a>
          <a href="#solucao" className="hover:text-foreground transition-colors">Solução</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Preços</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login"><Button variant="ghost" size="sm" className="text-sm font-semibold hover:bg-accent/5">Entrar</Button></Link>
          <Link to="/cadastro"><Button size="sm" variant="gradient" className="text-sm px-6 font-bold shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all">Começar Grátis</Button></Link>
        </div>
      </div>
    </header>
  );
}
