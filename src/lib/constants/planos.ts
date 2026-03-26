export const PLANOS = {
  FREE: {
    id: 'free',
    nome: 'Free',
    preco: 0,
    limites: {
      declaracoes: 3,
      usuarios: 1,
      storage_gb: 5,
    },
    features: {
      malha_fina: true,
      calculadora_ir: true,
      chat_clientes: true,
      kanban: true,
      dashboard: true,
      notificacoes_email: true,
      whatsapp: false,
      portal_cliente: false,
      api_publica: false,
      whitelabel: false,
    },
  },
  PRO: {
    id: 'pro',
    nome: 'Pro',
    preco: 49.90,
    limites: {
      declaracoes: null, // ilimitado
      usuarios: 5,
      storage_gb: null, // ilimitado
    },
    features: {
      malha_fina: true,
      calculadora_ir: true,
      chat_clientes: true,
      kanban: true,
      dashboard: true,
      notificacoes_email: true,
      whatsapp: false, // addon
      portal_cliente: false, // addon
      api_publica: false, // addon
      whitelabel: false, // addon
      usuarios_multiplos: true,
      declaracoes_ilimitadas: true,
      storage_ilimitado: true,
      suporte_prioritario: true,
    },
  },
} as const;

export const ADDONS = {
  WHATSAPP: {
    id: 'whatsapp',
    nome: 'WhatsApp',
    descricao: 'Envio de mensagens automáticas via WhatsApp',
    preco: 19.90,
    icone: 'message-circle',
  },
  PORTAL_CLIENTE: {
    id: 'portal_cliente',
    nome: 'Portal do Cliente',
    descricao: 'Área exclusiva para seus clientes',
    preco: 14.90,
    icone: 'user-circle',
  },
  API_PUBLICA: {
    id: 'api_publica',
    nome: 'API Pública',
    descricao: 'Integração com sistemas externos',
    preco: 29.90,
    icone: 'code',
  },
  WHITELABEL: {
    id: 'whitelabel',
    nome: 'Whitelabel',
    descricao: 'Sua marca no portal',
    preco: 9.90,
    icone: 'palette',
  },
  USUARIO_EXTRA: {
    id: 'usuario_extra',
    nome: 'Usuário Extra',
    descricao: 'A partir do 6º usuário',
    preco: 9.90,
    icone: 'user-plus',
  },
} as const;

export const PRECOS = {
  DECLARACAO_EXTRA: 9.90,
} as const;

export type PlanoId = 'free' | 'pro';
export type AddonId = keyof typeof ADDONS;

export function getPlanoConfig(planoNome: string) {
  const normalized = planoNome?.toLowerCase();
  if (normalized === 'pro' || normalized === 'profissional') return PLANOS.PRO;
  return PLANOS.FREE;
}
