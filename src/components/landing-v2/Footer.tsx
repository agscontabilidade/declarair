import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import logoFull from '@/assets/logo-full.png';

export default function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--lv2-slate-200))] py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <img src={logoFull} alt="DeclaraIR" className="h-8 mb-3" />
            <p className="text-xs text-[hsl(var(--lv2-slate-500))] leading-relaxed">
              O sistema que organiza o IR do seu escritório.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-[hsl(var(--lv2-slate-950))] text-sm mb-3">Produto</h4>
            <ul className="space-y-2 text-xs text-[hsl(var(--lv2-slate-500))]">
              <li><a href="#features" className="hover:text-[hsl(var(--lv2-slate-950))] transition-colors">Funcionalidades</a></li>
              <li><a href="#pricing" className="hover:text-[hsl(var(--lv2-slate-950))] transition-colors">Preços</a></li>
              <li><a href="#faq" className="hover:text-[hsl(var(--lv2-slate-950))] transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-[hsl(var(--lv2-slate-950))] text-sm mb-3">Empresa</h4>
            <ul className="space-y-2 text-xs text-[hsl(var(--lv2-slate-500))]">
              <li><Link to="/sobre" className="hover:text-[hsl(var(--lv2-slate-950))] transition-colors">Sobre nós</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-[hsl(var(--lv2-slate-950))] text-sm mb-3">Legal</h4>
            <ul className="space-y-2 text-xs text-[hsl(var(--lv2-slate-500))]">
              <li><Link to="/termos-de-uso" className="hover:text-[hsl(var(--lv2-slate-950))] transition-colors">Termos de Uso</Link></li>
              <li><Link to="/politica-de-privacidade" className="hover:text-[hsl(var(--lv2-slate-950))] transition-colors">Privacidade</Link></li>
              <li><Link to="/politica-lgpd" className="hover:text-[hsl(var(--lv2-slate-950))] transition-colors">LGPD</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[hsl(var(--lv2-slate-200))] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[hsl(var(--lv2-slate-500))]">© {new Date().getFullYear()} DeclaraIR. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1 text-xs text-[hsl(var(--lv2-slate-500))]">
            <Lock className="h-3 w-3" /> Dados protegidos com criptografia
          </div>
        </div>
      </div>
    </footer>
  );
}
