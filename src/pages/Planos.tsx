import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription, useCancelSubscription } from '@/hooks/useBilling';
import { PlanosHeader } from '@/components/planos/PlanosHeader';
import { ComoFunciona } from '@/components/planos/ComoFunciona';
import { PlanosCards } from '@/components/planos/PlanosCards';
import { TabelaAvulso } from '@/components/planos/TabelaAvulso';
import { ProvaSocial } from '@/components/planos/ProvaSocial';
import { GarantiaCTA } from '@/components/planos/GarantiaCTA';

export default function Planos() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const escritorioId = profile.escritorioId;

  const { data: escritorio } = useQuery({
    queryKey: ['escritorio-plano', escritorioId],
    queryFn: async () => {
      const { data } = await supabase.from('escritorios').select('plano').eq('id', escritorioId!).single();
      return data;
    },
    enabled: !!escritorioId,
  });

  const { data: subData } = useSubscription();
  const cancelSub = useCancelSubscription();
  const planoAtual = escritorio?.plano || 'gratuito';

  return (
    <DashboardLayout>
      <div className="space-y-16 pb-12">
        <PlanosHeader />
        <ComoFunciona />
        <PlanosCards
          planoAtual={planoAtual}
          subData={subData}
          cancelSub={cancelSub}
          onNavigate={(planoId) => navigate(`/checkout?plano=${planoId}`)}
        />
        <TabelaAvulso />
        <ProvaSocial />
        <GarantiaCTA onNavigate={() => navigate('/checkout?plano=starter')} />
      </div>
    </DashboardLayout>
  );
}
