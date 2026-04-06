export const PLANOS = {
  FREE: {
    id: 'free',
    nome: 'Free',
    descricao: 'Para testar a plataforma',
    preco: 0,
    periodo: null,
    stripe_price_id: null,
    limites: {
      declaracoes: 1,
      usuarios: 1,
      storage_mb: 500,
      declaracoes_extras: false,
    },
    features: {
      gestao_declaracoes: true,
      gestao_clientes: true,
      cobranca_manual: true,
      portal_cliente_basico: true,
      dashboard_basico: true,
      malha_fina: false,
      calculadora_ir: false,
      chat_clientes: false,
      kanban: false,
      notificacoes_email: false,
      whatsapp: false,
      portal_cliente_completo: false,
      api_publica: false,
      whitelabel: false,
      cobranca_automatica: false,
      usuarios_multiplos: false,
      suporte_prioritario: false,
    },
  },

  PRO: {
    id: 'pro',
    nome: 'Pro',
    descricao: 'Plano completo para escritórios contábeis',
    preco: 49.90,
    periodo: 'mensal',
    stripe_price_id: 'price_1TJFRFP18NMeNQ6G1ftJ5I2h',
    limites: {
      declaracoes: 3,
      usuarios: 5,
      storage_mb: null,
      declaracoes_extras: true,
    },
    features: {
      gestao_declaracoes: true,
      gestao_clientes: true,
      cobranca_manual: true,
      portal_cliente_basico: true,
      dashboard_completo: true,
      malha_fina: true,
      calculadora_ir: true,
      chat_clientes: true,
      kanban: true,
      notificacoes_email: true,
      cobranca_automatica: true,
      usuarios_multiplos: true,
      suporte_prioritario: true,
      whatsapp: false,
      portal_cliente_completo: false,
      api_publica: false,
      whitelabel: false,
    },
  },
} as const;

export const ADDONS = {
  WHATSAPP: {
    id: 'whatsapp',
    nome: 'WhatsApp Integrado',
    descricao: 'Envio automático de mensagens via WhatsApp',
    preco: 19.90,
    periodo: 'mensal',
    stripe_price_id: 'price_addon_whatsapp_1990',
    icone: 'MessageCircle',
    features: [
      'Notificações automáticas no WhatsApp',
      'Chat integrado com Evolution API',
      'Templates personalizáveis',
      'Histórico completo de mensagens',
    ],
  },

  PORTAL_CLIENTE: {
    id: 'portal_cliente',
    nome: 'Portal do Cliente Completo',
    descricao: 'Área exclusiva avançada para seus clientes',
    preco: 14.90,
    periodo: 'mensal',
    stripe_price_id: 'price_addon_portal_1490',
    icone: 'ShieldCheck',
    features: [
      'Wizard guiado de preenchimento',
      'Upload ilimitado de documentos',
      'Chat em tempo real',
      'Acompanhamento detalhado',
      'Notificações personalizadas',
    ],
  },

  API_PUBLICA: {
    id: 'api_publica',
    nome: 'API Pública',
    descricao: 'Integração com sistemas externos via REST API',
    preco: 29.90,
    periodo: 'mensal',
    stripe_price_id: 'price_addon_api_2990',
    icone: 'Brain',
    features: [
      'API REST completa',
      'Webhooks configuráveis',
      'Documentação interativa',
      '10.000 requisições/mês',
      'Suporte técnico dedicado',
    ],
  },

  WHITELABEL: {
    id: 'whitelabel',
    nome: 'White-label Avançado',
    descricao: 'Sua marca no portal do cliente',
    preco: 49.90,
    periodo: 'mensal',
    stripe_price_id: 'price_addon_whitelabel_4990',
    icone: 'Palette',
    features: [
      'Logo personalizada',
      'Cores da sua marca',
      'Domínio personalizado',
      'Emails com sua identidade',
    ],
  },

  USUARIO_EXTRA: {
    id: 'usuario_extra',
    nome: 'Usuário Extra',
    descricao: 'Adicione mais profissionais à equipe',
    preco: 9.90,
    periodo: 'mensal',
    stripe_price_id: 'price_addon_user_990',
    icone: 'Zap',
    features: [
      'Usuário adicional',
      'Permissões personalizadas',
      'Acesso completo à plataforma',
    ],
    nota: 'A partir do 6º usuário',
  },
} as const;

export const PRECOS = {
  DECLARACAO_EXTRA: {
    preco: 9.90,
    stripe_price_id: 'price_declaracao_extra_990',
    descricao: 'Declaração adicional',
    tipo: 'unitario',
  },
} as const;

export type PlanoId = 'free' | 'pro';
export type AddonId = keyof typeof ADDONS;

export function getPlanoConfig(planoNome: string) {
  const normalized = planoNome?.toLowerCase();
  if (normalized === 'pro' || normalized === 'profissional') {
    return PLANOS.PRO;
  }
  return PLANOS.FREE;
}

export function formatarPreco(preco: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(preco);
}

export function calcularTotalMensal(
  plano: PlanoId,
  addons: AddonId[],
  declaracoesExtras: number = 0
): number {
  let total = PLANOS[plano.toUpperCase() as keyof typeof PLANOS].preco;

  addons.forEach(addonId => {
    const addon = ADDONS[addonId.toUpperCase() as keyof typeof ADDONS];
    if (addon) {
      total += addon.preco;
    }
  });

  total += declaracoesExtras * PRECOS.DECLARACAO_EXTRA.preco;

  return total;
}
