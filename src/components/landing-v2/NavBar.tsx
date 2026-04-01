import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';

const NAV_LINKS = [
  { label: 'A Dor', href: '#dor' },
  { label: 'Solução', href: '#solucao' },
  { label: 'Recursos', href: '#features' },
  { label: 'Preços', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-scrolled shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/landing-v2" className="flex items-center">
          <img src={logoFull} alt="DeclaraIR" className="h-10 sm:h-12 w-auto object-contain" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[hsl(var(--lv2-slate-500))] hover:text-[hsl(var(--lv2-slate-950))] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-sm font-medium text-[hsl(var(--lv2-slate-500))] hover:text-[hsl(var(--lv2-slate-950))]">
              Entrar
            </Button>
          </Link>
          <Link to="/cadastro">
            <Button
              size="sm"
              className="glow-btn text-sm px-5 font-semibold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-lg"
            >
              Começar Grátis
            </Button>
          </Link>
        </div>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-[hsl(var(--lv2-slate-50))]">
            <div className="flex flex-col gap-6 mt-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-[hsl(var(--lv2-slate-800))] hover:text-[hsl(var(--lv2-emerald))]"
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-[hsl(var(--lv2-slate-200))]" />
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">Entrar</Button>
              </Link>
              <Link to="/cadastro" onClick={() => setOpen(false)}>
                <Button className="w-full bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
