import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClienteHeader } from '@/components/cliente-perfil/ClienteHeader';
import { AbaVisaoGeral } from '@/components/cliente-perfil/AbaVisaoGeral';
import { AbaDocumentos } from '@/components/cliente-perfil/AbaDocumentos';
import { AbaCobrancas } from '@/components/cliente-perfil/AbaCobrancas';
import { AbaComunicacoes } from '@/components/cliente-perfil/AbaComunicacoes';
import { useClientePerfil } from '@/hooks/useClientePerfil';
import { useDeclaracao } from '@/hooks/useDeclaracao';
import { useWhatsAppStatus } from '@/hooks/useWhatsApp';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ClientePerfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [declaracaoModalOpen, setDeclaracaoModalOpen] = useState(false);

  const {
    cliente, isLoading,
    declaracoes, declaracoesLoading,
    cobrancas, cobrancasLoading,
    mensagens, mensagensLoading,
    contadores,
    enviarConvite, criarDeclaracao,
    marcarPago, criarCobranca,
  } = useClientePerfil(id);

  const whatsappStatus = useWhatsAppStatus();
  const whatsappConectado = whatsappStatus.data?.status === 'connected';

  const activeDeclaracao = declaracoes.find(d => d.status !== 'transmitida') || declaracoes[0];
  const declHook = useDeclaracao(activeDeclaracao?.id);
  const formularioStatus = declHook.formularioIR?.status_preenchimento;

  const handleEnviarConvite = (mode: 'auto' | 'copy' | 'email' | 'whatsapp-manual') => {
    enviarConvite.mutate(mode, {
      onSuccess: (result) => {
        switch (result?.mode) {
          case 'auto':
            toast.success('Convite enviado via WhatsApp!', {
              description: 'A mensagem foi disparada automaticamente para o cliente.',
            });
            break;
          case 'copy':
            toast.success('Link copiado!', {
              description: 'Cole o link e envie para o cliente manualmente.',
            });
            break;
          case 'email':
            toast.success('Convite gerado!', {
              description: 'O e-mail foi aberto para envio.',
            });
            break;
          case 'whatsapp-manual':
            toast.success('Convite gerado!', {
              description: 'O WhatsApp Web foi aberto para envio.',
            });
            break;
        }
      },
      onError: () => toast.error('Erro ao gerar convite'),
    });
  };

  const handleCriarDeclaracao = (data: { ano_base: number; contador_id: string | null }) => {
    criarDeclaracao.mutate(data, {
      onSuccess: () => toast.success('Declaração criada com sucesso!'),
      onError: () => toast.error('Erro ao criar declaração'),
    });
  };

  const handleMarcarPago = (cobrancaId: string) => {
    marcarPago.mutate(cobrancaId, {
      onSuccess: () => toast.success('Cobrança marcada como paga'),
      onError: () => toast.error('Erro ao atualizar cobrança'),
    });
  };

  const handleCriarCobranca = (data: { descricao: string; valor: number; data_vencimento: string }) => {
    criarCobranca.mutate(data, {
      onSuccess: () => toast.success('Cobrança criada com sucesso!'),
      onError: () => toast.error('Erro ao criar cobrança'),
    });
  };

  const handleUpload = (docId: string, file: File) => {
    declHook.uploadDoc.mutate({ docId, file }, {
      onSuccess: () => toast.success('Documento enviado com sucesso!'),
      onError: () => toast.error('Erro ao enviar documento'),
    });
  };

  const handleAddDocItem = (input: { nome_documento: string; categoria: string }) => {
    declHook.addDocItem.mutate(input, {
      onSuccess: () => toast.success('Documento adicionado ao checklist'),
      onError: () => toast.error('Erro ao adicionar documento'),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/clientes')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>

        <ClienteHeader
          cliente={cliente}
          isLoading={isLoading}
          onEnviarConvite={handleEnviarConvite}
          enviandoConvite={enviarConvite.isPending}
          whatsappConectado={whatsappConectado}
          whatsappLoading={whatsappStatus.isLoading}
        />

        <Tabs defaultValue="visao-geral">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
            <TabsTrigger value="comunicacoes">Comunicações</TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral">
            <AbaVisaoGeral
              declaracoes={declaracoes}
              isLoading={declaracoesLoading}
              contadores={contadores}
              onCriarDeclaracao={handleCriarDeclaracao}
              criandoDeclaracao={criarDeclaracao.isPending}
              formularioStatus={formularioStatus}
            />
          </TabsContent>

          <TabsContent value="documentos">
            <AbaDocumentos
              checklist={declHook.checklist}
              isLoading={declHook.checklistLoading}
              declaracaoId={activeDeclaracao?.id}
              onUpload={handleUpload}
              uploading={declHook.uploadDoc.isPending}
              onAddItem={handleAddDocItem}
              hasDeclaracao={!!activeDeclaracao}
              onCreateDeclaracao={() => setDeclaracaoModalOpen(true)}
            />
          </TabsContent>

          <TabsContent value="cobrancas">
            <AbaCobrancas
              cobrancas={cobrancas}
              isLoading={cobrancasLoading}
              onMarcarPago={handleMarcarPago}
              onCriarCobranca={handleCriarCobranca}
              criandoCobranca={criarCobranca.isPending}
            />
          </TabsContent>

          <TabsContent value="comunicacoes">
            <AbaComunicacoes
              mensagens={mensagens}
              isLoading={mensagensLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
