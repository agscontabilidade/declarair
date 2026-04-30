import { MessageSquareWarning, FileQuestion, Clock, RotateCcw, TrendingDown } from 'lucide-react';
import { AlertTriangle, XCircle, CheckCircle2, Layout, Smartphone, Shield, Zap, Palette, Receipt, Target, Star, DollarSign, Flame, ArrowRight } from 'lucide-react';

export const painPoints = [
  { icon: MessageSquareWarning, text: 'Cliente mandando documento solto no WhatsApp' },
  { icon: FileQuestion, text: 'Informações incompletas toda vez' },
  { icon: Clock, text: 'Você perdendo horas organizando o que o cliente deveria ter mandado certo' },
  { icon: RotateCcw, text: 'Retrabalho constante — e na reta final, o caos dobra' },
  { icon: TrendingDown, text: 'Baixa lucratividade pelo esforço absurdo' },
];

export const beforeAfter = [
  { before: 'Caos no WhatsApp', after: 'Fluxo organizado e automático' },
  { before: 'Cliente perdido sem saber o que enviar', after: 'Cliente guiado com checklist inteligente' },
  { before: 'Retrabalho a cada declaração', after: 'Processo previsível e escalável' },
  { before: 'Correria desesperada no prazo', after: 'Controle total — sem surpresas' },
  { before: 'Trabalhar mais, faturar igual', after: 'Trabalhar menos, faturar mais' },
];

export const featuresTranslated = [
  { icon: Layout, title: 'Veja quem está pendente agora', desc: 'Pare de correr atrás no último dia. O dashboard mostra exatamente quem falta, quem travou e onde está o gargalo — em tempo real.' },
  { icon: Smartphone, title: 'Cliente envia tudo certo, no lugar certo', desc: 'Sem te travar no WhatsApp. O portal guia o cliente a enviar cada documento no formato correto, automaticamente.' },
  // Malha Fina removed
  { icon: Zap, title: 'Simule o resultado do IR em segundos', desc: 'Compare Simplificada vs Completa instantaneamente. Mostre pro cliente o cenário ideal e feche o serviço mais rápido.' },
  { icon: Palette, title: 'Cobre mais com uma experiência profissional', desc: 'Whitelabel com sua marca no portal. Seu cliente vê o seu nome, não o nosso. Isso é percepção de valor — e valor se cobra.' },
  { icon: Receipt, title: 'Cobre via Pix e cartão sem sair da plataforma', desc: 'Gere cobranças, acompanhe pagamentos e pare de perseguir cliente inadimplente. Tudo integrado.' },
];

export const testimonials = [
  { name: 'Carlos Silva', role: 'Contador — SP', text: 'Reduzi pela metade o tempo por cliente. Antes eu perdia 3 dias organizando documento. Agora chega tudo pronto.', stars: 5, avatar: '/assets/avatar-carlos.jpg' },
  { name: 'Ana Beatriz', role: 'Escritório ContaFácil — MG', text: 'Consegui atender 40% mais clientes sem contratar ninguém. O sistema faz o trabalho pesado.', stars: 5, avatar: '/assets/avatar-ana.jpg' },
  { name: 'Roberto Mendes', role: 'Contador autônomo — RJ', text: 'Minha vida mudou. Menos estresse, mais controle, mais faturamento. Não volto pra planilha nunca mais.', stars: 5, avatar: '/assets/avatar-roberto.jpg' },
];

export const objections = [
  { objection: '"Já uso planilha"', answer: 'Planilha organiza dados. Não organiza processo. E muito menos cliente. Quando o WhatsApp toca pela 30ª vez pedindo a mesma coisa, a planilha não te salva.' },
  { objection: '"Não tenho tempo de aprender sistema novo"', answer: 'Se você tem tempo de reorganizar documento que o cliente mandou errado, tem tempo de apertar 3 botões. Sério: são 2 minutos pra configurar.' },
  { objection: '"É caro demais"', answer: 'Um único erro no IR pode custar mais que um ano inteiro do sistema. R$ 29,90 por mês é menos que o valor de UMA declaração. A matemática é simples.' },
  { objection: '"Meu escritório é pequeno demais"', answer: 'Comece grátis com 1 declaração. Sem contrato. Se não servir, você não gastou nada. Se servir, desbloqueie tudo por R$ 29,90/mês.' },
];

export const faqs = [
  { q: 'Como funciona o plano gratuito?', a: 'O plano Free libera 1 declaração completa com chat, kanban e 500 MB de armazenamento — ideal para conhecer a plataforma sem compromisso.' },
  { q: 'Qual a diferença entre Free e Pro?', a: 'O Pro (R$ 49,90/mês) inclui 3 declarações, até 5 usuários, armazenamento ilimitado, calculadora de IR e suporte prioritário. Declarações adicionais custam R$ 4,90 cada.' },
  { q: 'Meus dados e os dos meus clientes estão seguros?', a: 'Sim. Utilizamos criptografia, banco de dados isolado por escritório e controle de acesso em nível de linha (RLS) em todas as tabelas, em conformidade com a LGPD.' },
  { q: 'Meus clientes precisam instalar algo?', a: 'Não. O portal do cliente é 100% web — funciona em qualquer celular ou computador. Basta enviar o link de convite.' },
  { q: 'O que são os Recursos Extras?', a: 'Módulos opcionais que ampliam a plataforma: integração com WhatsApp (R$ 19,90/mês), API Pública (R$ 29,90/mês) e Whitelabel com sua marca (R$ 49,90/mês).' },
  { q: 'Existe contrato de fidelidade?', a: 'Não. A cobrança é mensal e você pode cancelar a qualquer momento, sem multa e sem burocracia.' },
];
