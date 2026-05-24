import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeclaracaoHeader } from '@/components/declaracao/DeclaracaoHeader';
import { TransmitidaModal } from '@/components/declaracao/TransmitidaModal';
import { EnviarDeclaracaoEmailModal } from '@/components/declaracoes/EnviarDeclaracaoEmailModal';
import { AbaDocumentosUnificada } from '@/components/declaracao/AbaDocumentosUnificada';
import { SecaoInformacoesCadastrais } from '@/components/declaracao/SecaoInformacoesCadastrais';
import { SecaoResultado } from '@/components/declaracao/SecaoResultado';
import { SecaoNotas } from '@/components/declaracao/SecaoNotas';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

import { SecaoChat } from '@/components/declaracao/SecaoChat';
import { SecaoTimeline } from '@/components/declaracao/SecaoTimeline';
import { SecaoAnaliseCaixa } from '@/components/declaracao/SecaoAnaliseCaixa';
import { useDeclaracao } from '@/hooks/useDeclaracao';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
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

  const escritorioId = hook.declaracao?.escritorio_id;
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
  const isTransmitida = hook.declaracao?.status === 'transmitida' || !!hook.declaracao?.recibo_validado_em;
  const decl = hook.declaracao as any;
  const podeEnviarAoCliente = !!decl?.arquivo_declaracao_url && !!decl?.arquivo_recibo_url;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DeclaracaoHeader
          declaracao={hook.declaracao}
          papel={hook.papel}
          onChangeStatus={handleChangeStatus}
        />

        {podeEnviarAoCliente && (
          <div className="flex justify-end">
            <Button 
              onClick={() => setEnviarModalOpen(true)} 
              className={decl?.declaracao_enviada_em ? "gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-emerald-50/30" : "gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"}
              variant={decl?.declaracao_enviada_em ? "outline" : "default"}
            >
              <Send className="h-4 w-4" />
              {decl?.declaracao_enviada_em ? 'Reenviar Declaração ao Cliente' : 'Enviar Declaração ao Cliente'}
            </Button>
          </div>
        )}

        <Tabs defaultValue="documentos" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="cadastro">Informações Cadastrais</TabsTrigger>
            <TabsTrigger value="resultado">Resultado</TabsTrigger>
            <TabsTrigger value="analise-caixa">Análise de Caixa</TabsTrigger>
            <TabsTrigger value="chat">Mensagens</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="documentos" className="mt-4">
            {id && (
              <AbaDocumentosUnificada
                declaracaoId={id}
                clienteNome={hook.declaracao?.clientes?.nome}
              />
            )}
          </TabsContent>

          <TabsContent value="cadastro" className="mt-4">
            {id && (
              <SecaoInformacoesCadastrais
                declaracaoId={id}
                clienteId={clienteId}
              />
            )}
          </TabsContent>

          <TabsContent value="resultado" className="mt-4 space-y-6">
            <SecaoResultado declaracao={hook.declaracao} />
            <SecaoNotas
              observacoes={hook.notasInternas}
              onSave={handleSaveNotas}
            />
          </TabsContent>

          <TabsContent value="analise-caixa" className="mt-4">
            {id && <SecaoAnaliseCaixa declaracaoId={id} />}
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

        {id && hook.declaracao && (
          <EnviarDeclaracaoEmailModal
            open={enviarModalOpen}
            onOpenChange={setEnviarModalOpen}
            declaracaoId={id}
            clienteNome={hook.declaracao.clientes?.nome || ''}
            clienteEmail={hook.declaracao.clientes?.email || ''}
            anoBase={hook.declaracao.ano_base}
            arquivoDeclaracaoUrl={decl?.arquivo_declaracao_url}
            arquivoDeclaracaoNome={decl?.arquivo_declaracao_nome}
            arquivoReciboUrl={decl?.arquivo_recibo_url}
            arquivoReciboNome={decl?.arquivo_recibo_nome}
            arquivoDarfUrl={decl?.arquivo_darf_url}
            arquivoDarfNome={decl?.arquivo_darf_nome}
            arquivoMeiUrl={decl?.arquivo_mei_url}
            arquivoMeiNome={decl?.arquivo_mei_nome}
            arquivosOutros={(decl as any)?.arquivos_outros}

            onSuccess={() => {
              hook.refetch();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
