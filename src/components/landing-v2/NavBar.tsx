import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';

const NAV_LINKS = [
  { label: 'Problema', href: '#dor' },
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'nav-scrolled' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/landing-v2" className="flex items-center">
          <img
            src={logoFull}
            alt="DeclaraIR"
            className="h-9 sm:h-10 w-auto object-contain brightness-0 invert"
          />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-[13px] font-medium text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/5"
            >
              Entrar
            </Button>
          </Link>
          <Link to="/cadastro">
            <Button
              size="sm"
              className="glow-btn text-[13px] px-5 font-semibold bg-[hsl(var(--lv2-emerald))] hover:bg-[hsl(var(--lv2-emerald-light))] text-white rounded-full"
            >
              Começar Grátis →
            </Button>
          </Link>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-[hsl(var(--lv2-slate-950))] border-[hsl(var(--lv2-slate-800))]">
            <div className="flex flex-col gap-4 mt-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-white/70 hover:text-[hsl(var(--lv2-emerald))] transition-colors px-2 py-2"
                >
                  {link.label}
                </a>
              ))}
              <div className="h-px bg-[hsl(var(--lv2-slate-800))] my-2" />
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">Entrar</Button>
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
