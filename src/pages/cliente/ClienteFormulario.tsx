import { useState, useEffect, useMemo } from 'react';
import { ClienteLayout } from '@/components/layout/ClienteLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, ChevronLeft, ChevronRight, CheckCircle2, Save } from 'lucide-react';
import { useFormularioIR } from '@/hooks/useFormularioIR';
import { StepPerfilFiscal } from '@/components/formulario-ir/StepPerfilFiscal';
import { StepDadosPessoais } from '@/components/formulario-ir/StepDadosPessoais';
import { StepDependentes } from '@/components/formulario-ir/StepDependentes';
import { StepDocumentos } from '@/components/formulario-ir/StepDocumentos';
import { StepInfoAdicionais } from '@/components/formulario-ir/StepInfoAdicionais';
import { toast } from 'sonner';
import { DEFAULT_PERFIL, gerarChecklistPorPerfil, type PerfilFiscal } from '@/lib/checklistPorPerfil';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface StepDef {
  key: string;
  label: string;
}

export default function ClienteFormulario() {
  const { formData, updateField, declaracao, formulario, isLoading, saving, lastSaved, finalizar } = useFormularioIR();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [confirmado, setConfirmado] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [perfilFiscal, setPerfilFiscal] = useState<PerfilFiscal>(DEFAULT_PERFIL);

  // Sync perfil when formulario loads
  useEffect(() => {
    const pf = formulario?.perfil_fiscal;
    if (pf && typeof pf === 'object' && !Array.isArray(pf) && Object.keys(pf).length > 0) {
      setPerfilFiscal(pf as unknown as PerfilFiscal);
    }
  }, [formulario]);

  // Dynamic steps based on perfil - SMART LOGIC:
  // - Dados Pessoais only shown if dependentes is true (needs conjugal info)
  // - Dependentes step only if dependentes is true
  // - If no dependentes, system assumes solteiro, no conjugal data needed
  const steps = useMemo<StepDef[]>(() => {
    const s: StepDef[] = [
      { key: 'perfil', label: 'Perfil Fiscal' },
    ];
    // Only show dados pessoais if has dependentes (need to know marital status for cônjuge)
    if (perfilFiscal.dependentes) {
      s.push({ key: 'dados', label: 'Dados Pessoais' });
      s.push({ key: 'dependentes', label: 'Dependentes' });
    }
    s.push({ key: 'documentos', label: 'Envio de Documentos' });
    s.push({ key: 'final', label: 'Revisão e Envio' });
    return s;
  }, [perfilFiscal]);

  const totalSteps = steps.length;
  const currentStep = steps[step] || steps[0];
  const progress = Math.round(((step + 1) / totalSteps) * 100);

  // Fetch checklist for the document step
  const { data: checklist = [] } = useQuery({
    queryKey: ['formulario-checklist', declaracao?.id],
    queryFn: async () => {
      if (!declaracao?.id) return [];
      const { data } = await supabase
        .from('checklist_documentos')
        .select('id, nome_documento, categoria, obrigatorio, status, arquivo_nome, arquivo_url')
        .eq('declaracao_id', declaracao.id);
      return data || [];
    },
    enabled: !!declaracao?.id,
  });

  // Ensure step index stays within bounds when steps change
  useEffect(() => {
    if (step >= steps.length) {
      setStep(Math.max(0, steps.length - 1));
    }
  }, [steps.length, step]);

  if (isLoading) {
    return (
      <ClienteLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ClienteLayout>
    );
  }

  if (!declaracao) {
    return (
      <ClienteLayout>
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma declaração ativa</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Aguarde seu contador criar uma declaração</p>
          </CardContent>
        </Card>
      </ClienteLayout>
    );
  }

  if (concluido) {
    return (
      <ClienteLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="animate-in zoom-in-50 duration-500">
            <CheckCircle2 className="h-20 w-20 text-success mb-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Formulário Enviado!</h2>
          <p className="text-muted-foreground max-w-md">
            Seus dados foram enviados com sucesso. Seu contador irá analisar as informações e preparar sua declaração.
          </p>
        </div>
      </ClienteLayout>
    );
  }

  const handlePerfilChange = async (newPerfil: PerfilFiscal) => {
    setPerfilFiscal(newPerfil);
    if (formulario?.id) {
      await supabase
        .from('formulario_ir')
        .update({ perfil_fiscal: newPerfil as unknown as import('@/integrations/supabase/types').Json })
        .eq('id', formulario.id);
    }
  };

  const handleNextFromPerfil = async () => {
    if (!declaracao?.id) return;
    
    const checklistItems = gerarChecklistPorPerfil(perfilFiscal);

    // Always regenerate checklist when advancing from perfil step
    // Delete existing items first, then insert new ones
    await supabase
      .from('checklist_documentos')
      .delete()
      .eq('declaracao_id', declaracao.id);

    const items = checklistItems.map(item => ({
      nome_documento: item.nome_documento,
      categoria: item.categoria,
      obrigatorio: item.obrigatorio,
      declaracao_id: declaracao.id,
    }));
    
    if (items.length > 0) {
      await supabase.from('checklist_documentos').insert(items);
    }

    // If no dependentes, auto-set solteiro and clear conjugal data
    if (!perfilFiscal.dependentes) {
      updateField('estado_civil', 'solteiro');
      updateField('conjuge_nome', '');
      updateField('conjuge_cpf', '');
      updateField('dependentes', []);
    }

    // Refresh checklist query
    queryClient.invalidateQueries({ queryKey: ['formulario-checklist'] });
    toast.success('Perfil fiscal salvo! Checklist de documentos atualizado.');
    setStep(1);
  };

  const handleFinalizar = async () => {
    if (!confirmado) {
      toast.error('Confirme a veracidade das informações');
      return;
    }

    // Check pending documents
    const pendingDocs = checklist.filter(d => d.status === 'pendente');
    
    // Notify accountant about pending docs
    if (pendingDocs.length > 0) {
      try {
        const obrigatoriosPendentes = pendingDocs.filter(d => d.obrigatorio);
        const msg = obrigatoriosPendentes.length > 0
          ? `Cliente finalizou o formulário com ${pendingDocs.length} documento(s) pendente(s), sendo ${obrigatoriosPendentes.length} obrigatório(s).`
          : `Cliente finalizou o formulário com ${pendingDocs.length} documento(s) opcional(is) pendente(s).`;

        await supabase.from('notificacoes').insert({
          escritorio_id: declaracao.escritorio_id,
          titulo: '⚠️ Documentos pendentes',
          mensagem: msg,
          link_destino: `/clientes/${declaracao.cliente_id}`,
        });

        await supabase.from('declaracao_atividades').insert({
          declaracao_id: declaracao.id,
          tipo: 'documento',
          descricao: `Cliente finalizou formulário com ${pendingDocs.length} documento(s) pendente(s)`,
          usuario_nome: 'Cliente',
        });
      } catch { /* best-effort */ }
    }

    const ok = await finalizar();
    if (ok) {
      if (pendingDocs.length > 0) {
        toast.info(`Formulário enviado! ${pendingDocs.length} documento(s) ainda pendente(s) — seu contador será notificado.`);
      }
      setConcluido(true);
    }
  };

  const handleNext = () => {
    if (currentStep.key === 'perfil') {
      handleNextFromPerfil();
    } else {
      setStep(s => Math.min(s + 1, totalSteps - 1));
    }
  };

  const handlePrev = () => setStep(s => Math.max(0, s - 1));

  const isLastStep = step === totalSteps - 1;

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Formulário IR {declaracao.ano_base}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Etapa {step + 1} de {totalSteps} — {currentStep.label}
            </p>
          </div>
          {lastSaved && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Save className="h-3.5 w-3.5" />
              Rascunho salvo às {lastSaved}
            </div>
          )}
        </div>

        <Progress value={progress} className="h-2" />

        {/* Step Content */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            {currentStep.key === 'perfil' && (
              <StepPerfilFiscal perfil={perfilFiscal} onChange={handlePerfilChange} />
            )}
            {currentStep.key === 'dados' && (
              <StepDadosPessoais data={formData} onChange={updateField} />
            )}
            {currentStep.key === 'dependentes' && (
              <StepDependentes data={formData} onChange={updateField} />
            )}
            {currentStep.key === 'documentos' && (
              <StepDocumentos
                checklist={checklist}
                declaracaoId={declaracao.id}
                escritorioId={declaracao.escritorio_id}
                clienteId={profile.clienteId || ''}
              />
            )}
            {currentStep.key === 'final' && (
              <StepInfoAdicionais
                data={formData}
                onChange={updateField}
                confirmado={confirmado}
                onConfirmChange={setConfirmado}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handlePrev}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleFinalizar}
              disabled={saving}
              className="w-full sm:w-auto bg-success hover:bg-success/90 active:scale-[0.98]"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" /> Finalizar
            </Button>
          ) : (
            <Button
              className="w-full sm:w-auto active:scale-[0.98]"
              onClick={handleNext}
            >
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </ClienteLayout>
  );
}
