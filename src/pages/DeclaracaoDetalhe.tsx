import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeclaracaoHeader } from '@/components/declaracao/DeclaracaoHeader';
import { TransmitidaModal } from '@/components/declaracao/TransmitidaModal';
import { EnviarDeclaracaoModal } from '@/components/declaracao/EnviarDeclaracaoModal';
import { AbaDocumentos } from '@/components/cliente-perfil/AbaDocumentos';
import { SecaoFormularioIR } from '@/components/declaracao/SecaoFormularioIR';
import { SecaoResultado } from '@/components/declaracao/SecaoResultado';
import { SecaoNotas } from '@/components/declaracao/SecaoNotas';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

import { SecaoChat } from '@/components/declaracao/SecaoChat';
import { SecaoTimeline } from '@/components/declaracao/SecaoTimeline';
import { useDeclaracao } from '@/hooks/useDeclaracao';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QueryError } from '@/components/ui/QueryError';

export default function DeclaracaoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const hook = useDeclaracao(id);
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [transmitidaModalOpen, setTransmitidaModalOpen] = useState(false);
  const [enviarModalOpen, setEnviarModalOpen] = useState(false);
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

  // Fetch escritorio data for the capa
  const escritorioId = hook.declaracao?.escritorio_id;
  const { data: escritorioData } = useQuery({
    queryKey: ['escritorio-enviar', escritorioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escritorios')
        .select('nome, email, telefone, logo_url')
        .eq('id', escritorioId!)
        .single();
      if (error) throw error;
      return { nome: data.nome, email: data.email, telefone: data.telefone, logoUrl: data.logo_url };
    },
    enabled: !!escritorioId,
  });

  const contadorNome = hook.declaracao?.usuarios?.nome || profile.nome || '';

  const handleSendChat = async (message: string) => {
    const clienteId = hook.declaracao?.clientes?.id;
    if (!id || !escritorioId || !clienteId || !user?.id) throw new Error('Dados incompletos');
    const { error } = await supabase
      .from('mensagens_chat')
      .insert({
        declaracao_id: id,
        escritorio_id: escritorioId,
        cliente_id: clienteId,
        remetente_tipo: 'contador',
        remetente_id: user.id,
        conteudo: message,
      });
    if (error) throw error;
  };

  if (hook.isError) {
    return (
      <DashboardLayout>
        <QueryError message={hook.error?.message} onRetry={() => hook.refetch()} />
      </DashboardLayout>
    );
  }

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

  const clienteId = hook.declaracao?.clientes?.id;
  const isTransmitida = hook.declaracao?.status === 'transmitida';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DeclaracaoHeader
          declaracao={hook.declaracao}
          papel={hook.papel}
          onChangeStatus={handleChangeStatus}
        />

        {isTransmitida && (
          <div className="flex justify-end">
            <Button onClick={() => setEnviarModalOpen(true)} className="gap-2">
              <Send className="h-4 w-4" />
              Enviar Declaração ao Cliente
            </Button>
          </div>
        )}

        <Tabs defaultValue="documentos" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="formulario">Formulário</TabsTrigger>
            <TabsTrigger value="resultado">Resultado</TabsTrigger>
            <TabsTrigger value="chat">Mensagens</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="documentos" className="mt-4">
            <AbaDocumentos
              checklist={hook.checklist}
              isLoading={hook.checklistLoading}
              declaracaoId={id}
              onUpload={handleUpload}
              uploading={hook.uploadDoc.isPending}
              onAddItem={handleAddDocItem}
              hasDeclaracao={true}
            />
          </TabsContent>

          <TabsContent value="formulario" className="mt-4">
            <SecaoFormularioIR
              formulario={hook.formularioIR}
              isLoading={hook.formularioLoading}
            />
          </TabsContent>




          <TabsContent value="resultado" className="mt-4 space-y-6">
            <SecaoResultado
              declaracao={hook.declaracao}
              onSave={handleSaveResultado}
              saving={hook.saveResultado.isPending}
            />
            <SecaoNotas
              observacoes={hook.declaracao?.observacoes_internas ?? null}
              onSave={handleSaveNotas}
            />
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            {clienteId && escritorioId && id ? (
              <SecaoChat
                declaracaoId={id}
                escritorioId={escritorioId}
                clienteId={clienteId}
              />
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Chat indisponível</p>
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            {id && <SecaoTimeline declaracaoId={id} />}
          </TabsContent>
        </Tabs>

        <TransmitidaModal
          open={transmitidaModalOpen}
          onOpenChange={setTransmitidaModalOpen}
          onSubmit={handleTransmitir}
          isPending={hook.updateStatus.isPending}
        />

        <EnviarDeclaracaoModal
          open={enviarModalOpen}
          onOpenChange={setEnviarModalOpen}
          declaracao={hook.declaracao}
          escritorioData={escritorioData || null}
          contadorNome={contadorNome}
          onSendChat={handleSendChat}
        />
      </div>
    </DashboardLayout>
  );
}
