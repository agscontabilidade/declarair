import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';


export type BillingStatus = 'active' | 'overdue' | 'cancelled' | 'free';

export interface PlanFeatures {
  gestao_declaracoes: boolean;
  gestao_clientes: boolean;
  cobranca_manual: boolean;
  portal_cliente_basico: boolean;
  dashboard_basico: boolean;
  malha_fina: boolean;
  calculadora_ir: boolean;
  chat_clientes: boolean;
  kanban: boolean;
  notificacoes_email: boolean;
  cobranca_automatica: boolean;
  usuarios_multiplos: boolean;
  suporte_prioritario: boolean;
  whatsapp: boolean;
  portal_cliente_completo: boolean;
  api_publica: boolean;
  whitelabel: boolean;
}

interface BillingState {
  status: BillingStatus;
  plano: string;
  isBlocked: boolean;
  isOverdue: boolean;
  loading: boolean;
  features: PlanFeatures;
}

const FREE_FEATURES: PlanFeatures = {
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
  cobranca_automatica: false,
  usuarios_multiplos: false,
  suporte_prioritario: false,
  whatsapp: false,
  portal_cliente_completo: false,
  api_publica: false,
  whitelabel: false,
};

const PRO_FEATURES: PlanFeatures = {
  gestao_declaracoes: true,
  gestao_clientes: true,
  cobranca_manual: true,
  portal_cliente_basico: true,
  dashboard_basico: true,
  malha_fina: true,
  calculadora_ir: true,
  chat_clientes: true,
  kanban: true,
  notificacoes_email: true,
  cobranca_automatica: true,
  usuarios_multiplos: true,
  suporte_prioritario: true,
  // Addons - checked separately
  whatsapp: false,
  portal_cliente_completo: false,
  api_publica: false,
  whitelabel: false,
};

export function useBillingStatus(): BillingState {
  const { profile } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['billing-status', profile.escritorioId],
    queryFn: async () => {
      const { data: assinatura } = await supabase
        .from('assinaturas')
        .select('status, plano')
        .eq('escritorio_id', profile.escritorioId!)
        .maybeSingle();

      const { data: escritorio } = await supabase
        .from('escritorios')
        .select('plano')
        .eq('id', profile.escritorioId!)
        .single();

      // Check active addons
      const { data: addons } = await supabase
        .from('escritorio_addons')
        .select('addon_id, status, addons(nome)')
        .eq('escritorio_id', profile.escritorioId!)
        .eq('status', 'ativo');

      const activeAddonNames = (addons || []).map((a: any) => a.addons?.nome?.toLowerCase() || '');

      return {
        subscriptionStatus: assinatura?.status || null,
        plano: escritorio?.plano || 'gratuito',
        activeAddonNames,
      };
    },
    enabled: !!profile.escritorioId,
    refetchInterval: 60000,
  });

  const plano = data?.plano || 'gratuito';
  const subStatus = data?.subscriptionStatus;
  const addonNames = data?.activeAddonNames || [];

  const isOverdue = subStatus === 'overdue';
  const isBlocked = isOverdue && plano !== 'gratuito';

  let status: BillingStatus = 'free';
  if (plano !== 'gratuito') {
    if (subStatus === 'active') status = 'active';
    else if (subStatus === 'overdue') status = 'overdue';
    else if (subStatus === 'cancelled') status = 'cancelled';
  }

  const isPro = plano.toLowerCase() === 'pro' || plano.toLowerCase() === 'profissional';
  const baseFeatures = isPro ? { ...PRO_FEATURES } : { ...FREE_FEATURES };

  // Apply addon overrides
  if (addonNames.some((n: string) => n.includes('whatsapp'))) baseFeatures.whatsapp = true;
  if (addonNames.some((n: string) => n.includes('portal'))) baseFeatures.portal_cliente_completo = true;
  if (addonNames.some((n: string) => n.includes('api'))) baseFeatures.api_publica = true;
  if (addonNames.some((n: string) => n.includes('whitelabel'))) baseFeatures.whitelabel = true;

  return {
    status,
    plano,
    isBlocked,
    isOverdue,
    loading: isLoading,
    features: baseFeatures,
  };
}
