import { Link } from 'react-router-dom';
import { Lock, ArrowUpRight } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';

const footerLinks = {
  Produto: [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Preços', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  Empresa: [
    { label: 'Sobre nós', href: '/sobre', isRoute: true },
  ],
  Legal: [
    { label: 'Termos de Uso', href: '/termos-de-uso', isRoute: true },
    { label: 'Privacidade', href: '/politica-de-privacidade', isRoute: true },
    { label: 'LGPD', href: '/politica-lgpd', isRoute: true },
  ],
};

export default function Footer() {
  return (
    <footer className="relative bg-[hsl(var(--lv2-slate-950))] border-t border-white/5">
      {/* Gradient accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--lv2-emerald)/0.4)] to-transparent" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <img src={logoFull} alt="DeclaraIR" className="h-9 mb-5 brightness-0 invert opacity-70" />
            <p className="text-sm text-white/30 leading-relaxed max-w-[200px]">
              O sistema que organiza o IR do seu escritório.
            </p>
            <div className="flex items-center gap-2 mt-6 text-xs text-white/20">
              <Lock className="h-3.5 w-3.5" /> Dados protegidos com criptografia
            </div>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white/60 text-sm mb-5 uppercase tracking-wider text-xs">{category}</h4>
              <ul className="space-y-3.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.isRoute ? (
                      <Link to={link.href} className="text-sm text-white/30 hover:text-white/60 transition-colors flex items-center gap-1 group">
                        {link.label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ) : (
                      <a href={link.href} className="text-sm text-white/30 hover:text-white/60 transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} DeclaraIR. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-xs text-white/20 hover:text-white/40 transition-colors">Login Contador</Link>
            <Link to="/cliente/login" className="text-xs text-white/20 hover:text-white/40 transition-colors">Login Cliente</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
