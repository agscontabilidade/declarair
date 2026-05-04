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
  { icon: Layout, title: 'Gestão Visual e Kanban', desc: 'Pare de correr atrás no último dia. O dashboard mostra exatamente quem falta, quem travou e onde está o gargalo — em tempo real com cards inteligentes.' },
  { icon: Smartphone, title: 'Portal do Cliente Guiado', desc: 'Sem te travar no WhatsApp. O portal guia o cliente a enviar cada documento no formato correto, com checklist baseado no perfil fiscal.' },
  { icon: Zap, title: 'WhatsApp Automático', desc: 'Não é apenas chat. São notificações inteligentes que avisam o cliente quando o status da declaração muda ou quando faltam documentos.' },
  { icon: Shield, title: 'Drive Organizado por Natureza', desc: 'Documentos separados automaticamente em pastas "Enviadas pelo cliente" e "Enviados pelo contador". Entrega profissional e sem bagunça.' },
  { icon: Palette, title: 'Sua Marca, Sua Valorização', desc: 'Whitelabel com sua marca e cores no portal. O cliente vê o seu nome, não o nosso. Valorize seu serviço e cobre o que ele realmente vale.' },
  { icon: Receipt, title: 'Pagamento em 1 Clique', desc: 'Gere cobranças via Pix e cartão, acompanhe pagamentos e elimine a inadimplência. Tudo integrado ao fluxo da declaração.' },
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
  { q: 'Qual a diferença entre Free e Pro?', a: 'O Pro (R$ 49,90/mês) inclui 3 declarações, até 5 usuários simultâneos, armazenamento ilimitado, calculadora de IR e suporte prioritário. Declarações adicionais custam apenas R$ 4,90 cada.' },
  { q: 'Meus dados e os dos meus clientes estão seguros?', a: 'Sim. Utilizamos criptografia de ponta a ponta, banco de dados isolado por escritório e conformidade total com a LGPD.' },
  { q: 'Meus clientes precisam instalar algo?', a: 'Não. O portal do cliente é 100% web e responsivo — funciona em qualquer celular ou computador. Basta enviar o link de convite.' },
  { q: 'O que são os Recursos Extras?', a: 'Módulos opcionais para quem quer escalar: WhatsApp Automático (R$ 19,90), Portal Cliente Completo (R$ 14,90), API Pública (R$ 29,90) e Whitelabel (R$ 9,90).' },
  { q: 'Existe contrato de fidelidade?', a: 'Zero fidelidade. A cobrança é mensal e você pode cancelar a qualquer momento com um clique, sem multas.' },
];
