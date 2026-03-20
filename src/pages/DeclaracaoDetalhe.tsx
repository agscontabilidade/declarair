import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { DeclaracaoHeader } from '@/components/declaracao/DeclaracaoHeader';
import { TransmitidaModal } from '@/components/declaracao/TransmitidaModal';
import { AbaDocumentos } from '@/components/cliente-perfil/AbaDocumentos';
import { SecaoFormularioIR } from '@/components/declaracao/SecaoFormularioIR';
import { SecaoResultado } from '@/components/declaracao/SecaoResultado';
import { SecaoNotas } from '@/components/declaracao/SecaoNotas';
import { useDeclaracao } from '@/hooks/useDeclaracao';
import { toast } from 'sonner';

export default function DeclaracaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const hook = useDeclaracao(id);
  const [transmitidaModalOpen, setTransmitidaModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const handleChangeStatus = (newStatus: string) => {
    if (newStatus === 'transmitida') {
      setPendingStatus(newStatus);
      setTransmitidaModalOpen(true);
      return;
    }
    hook.updateStatus.mutate({ status: newStatus }, {
      onSuccess: () => toast.success(`Status atualizado para ${newStatus.replace(/_/g, ' ')}`),
      onError: () => toast.error('Erro ao atualizar status'),
    });
  };

  const handleTransmitir = (data: {
    numero_recibo: string;
    data_transmissao: string;
    tipo_resultado: string;
    valor_resultado: number | null;
  }) => {
    hook.updateStatus.mutate({
      status: 'transmitida',
      ...data,
    }, {
      onSuccess: () => {
        toast.success('Declaração transmitida com sucesso!');
        setTransmitidaModalOpen(false);
      },
      onError: () => toast.error('Erro ao registrar transmissão'),
    });
  };

  const handleSaveResultado = (data: { tipo_resultado: string; valor_resultado: number | null; numero_recibo: string }) => {
    hook.saveResultado.mutate(data, {
      onSuccess: () => toast.success('Resultado salvo!'),
      onError: () => toast.error('Erro ao salvar resultado'),
    });
  };

  const handleSaveNotas = (text: string) => {
    hook.saveNotas.mutate(text);
  };

  const handleUpload = (docId: string, file: File) => {
    hook.uploadDoc.mutate({ docId, file }, {
      onSuccess: () => toast.success('Documento enviado!'),
      onError: () => toast.error('Erro ao enviar documento'),
    });
  };

  const handleAddDocItem = (input: { nome_documento: string; categoria: string }) => {
    hook.addDocItem.mutate(input, {
      onSuccess: () => toast.success('Documento adicionado'),
      onError: () => toast.error('Erro ao adicionar documento'),
    });
  };

  if (hook.isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DeclaracaoHeader
          declaracao={hook.declaracao}
          papel={hook.papel}
          onChangeStatus={handleChangeStatus}
        />

        {/* Checklist */}
        <div>
          <h2 className="font-display text-lg font-bold mb-3">Checklist de Documentos</h2>
          <AbaDocumentos
            checklist={hook.checklist}
            isLoading={hook.checklistLoading}
            declaracaoId={id}
            onUpload={handleUpload}
            uploading={hook.uploadDoc.isPending}
            onAddItem={handleAddDocItem}
            hasDeclaracao={true}
          />
        </div>

        {/* Formulário IR */}
        <div>
          <h2 className="font-display text-lg font-bold mb-3">Formulário IR</h2>
          <SecaoFormularioIR
            formulario={hook.formularioIR}
            isLoading={hook.formularioLoading}
          />
        </div>

        {/* Resultado */}
        <SecaoResultado
          declaracao={hook.declaracao}
          onSave={handleSaveResultado}
          saving={hook.saveResultado.isPending}
        />

        {/* Notas */}
        <SecaoNotas
          observacoes={hook.declaracao?.observacoes_internas ?? null}
          onSave={handleSaveNotas}
        />

        <TransmitidaModal
          open={transmitidaModalOpen}
          onOpenChange={setTransmitidaModalOpen}
          onSubmit={handleTransmitir}
          isPending={hook.updateStatus.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
