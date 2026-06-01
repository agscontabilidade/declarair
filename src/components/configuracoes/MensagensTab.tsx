import { PlanGate, FeatureGate } from '@/components/billing/BillingGate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Wifi, WifiOff, QrCode, Trash2, RefreshCw, Phone, User, Calendar, Plus, Zap, FileText, Info, Bell } from 'lucide-react';
import { LembretesTemplateTab } from '@/components/configuracoes/LembretesTemplateTab';
import {
  useWhatsAppStatus,
  useCreateInstance,
  useConnectInstance,
  useDisconnectInstance,
  useDeleteInstance,
} from '@/hooks/useWhatsApp';
import { useAddons } from '@/hooks/useAddons';
import { ConfirmModal } from '@/components/cobrancas/ConfirmModal';
import { useState } from 'react';
import { formatPhone, formatDate } from '@/lib/formatters';
import { Link } from 'react-router-dom';
import { useMensagens } from '@/hooks/useMensagens';
import { TemplateList } from '@/components/mensagens/TemplateList';
import { TemplateEditor } from '@/components/mensagens/TemplateEditor';
import { AutomacoesWhatsAppTab } from '@/components/configuracoes/AutomacoesWhatsAppTab';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissoes } from '@/hooks/usePermissoes';
import { Alert, AlertDescription } from '@/components/ui/alert';

function formatWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    const national = digits.slice(2);
    return `+55 ${formatPhone(national)}`;
  }
  return `+${digits}`;
}

export function MensagensTab() {
  const { data: statusData, isLoading, refetch } = useWhatsAppStatus();
  const createInstance = useCreateInstance();
  const connectInstance = useConnectInstance();
  const disconnectInstance = useDisconnectInstance();
  const deleteInstance = useDeleteInstance();
  const { myAddons, catalog } = useAddons();
  const { profile: authProfile } = useAuth();
  const { isDono } = usePermissoes();
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Template states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editData, setEditData] = useState<{ id: string; nome?: string; canal?: string; assunto?: string; corpo?: string } | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  const {
    templates, loadingTemplates,
    criarTemplate, editarTemplate, toggleTemplate, deletarTemplate,
  } = useMensagens();

  const handleSaveTemplate = (data: { id?: string; nome: string; canal: string; assunto?: string; corpo: string }) => {
    if (data.id) {
      editarTemplate.mutate(data as { id: string; nome?: string; canal?: string; assunto?: string; corpo?: string }, { 
        onSuccess: () => { setEditorOpen(false); setEditData(null); } 
      });
    } else {
      criarTemplate.mutate(data as { nome: string; canal: string; assunto?: string; corpo: string }, { 
        onSuccess: () => { setEditorOpen(false); setEditData(null); } 
      });
    }
  };

  const whatsappAddon = catalog.find(a => a.nome.toLowerCase().includes('whatsapp'));
  const addonAtivo = whatsappAddon
    ? myAddons.some(a => a.addon_id === whatsappAddon.id && a.status === 'ativo')
    : false;

  const status = statusData?.status || 'not_created';
  const instance = statusData?.instance;
  const qrcode = instance?.qrcode_base64 || statusData?.qrcode;
  const profile = statusData?.profile;

  const isConnected = status === 'connected';

  const displayPhone = instance?.phone || profile?.phone;
  const displayName = instance?.profile_name || profile?.profileName;
  const displayPicture = instance?.profile_picture_url || profile?.profilePictureUrl;
  const connectedSince = isConnected && instance?.updated_at ? instance.updated_at : null;

  return (
    <div className="space-y-6">
      {/* Header explicativo da seção */}
      <div className="rounded-lg border bg-muted/30 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Comunicação com clientes via WhatsApp
          </p>
          <p className="text-sm text-muted-foreground">
            Aqui você conecta o WhatsApp do escritório, cria modelos de mensagens prontas
            e configura disparos automáticos quando algo acontece (ex: cliente cadastrado,
            cobrança vencida). <strong>Não é o chat interno do sistema</strong> — são
            mensagens reais enviadas para o WhatsApp dos seus clientes.
          </p>
        </div>
      </div>

      <Tabs defaultValue="conexao" className="w-full">
        <TabsList className="grid w-full max-w-[900px] grid-cols-5">
          <TabsTrigger value="conexao" className="gap-2">
            <Phone className="h-4 w-4" /> Conexão
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" /> Modelos
          </TabsTrigger>
          <TabsTrigger value="lembretes" className="gap-2">
            <Bell className="h-4 w-4" /> Lembretes
          </TabsTrigger>
          <TabsTrigger value="aviso-cobranca" className="gap-2">
            <Bell className="h-4 w-4" /> Aviso cobrança
          </TabsTrigger>
          <TabsTrigger value="automacoes" className="gap-2">
            <Zap className="h-4 w-4" /> Automáticos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conexao" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Conexão do WhatsApp</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Vincule o número do escritório ao sistema para enviar mensagens reais aos clientes
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          {!addonAtivo && (
            <Card className="border-warning/50 bg-warning/5 shadow-none">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <MessageSquare className="h-8 w-8 text-warning shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">Recurso WhatsApp não ativo</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Para utilizar o WhatsApp integrado, ative o recurso na página de{' '}
                      <Link to="/addons" className="text-primary underline">Recursos Extras</Link>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="space-y-3 text-center py-8">
                  <Skeleton className="h-48 w-48 mx-auto" />
                  <Skeleton className="h-10 w-full max-w-xs mx-auto" />
                </div>
              ) : status === 'not_created' ? (
                <div className="text-center py-8">
                  <QrCode className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Nenhuma instância configurada</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Crie uma instância para conectar seu WhatsApp e começar a enviar mensagens reais.
                  </p>
                  <Button
                    onClick={() => createInstance.mutate()}
                    disabled={createInstance.isPending || !addonAtivo}
                    size="lg"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {createInstance.isPending ? 'Criando...' : 'Criar Instância WhatsApp'}
                  </Button>
                </div>
              ) : isConnected ? (
                <div className="py-2">
                  <div className="flex items-center gap-5 mb-6">
                    <Avatar className="h-16 w-16 border-2 border-emerald-500/30">
                      {displayPicture ? (
                        <AvatarImage src={displayPicture} alt={displayName || 'Perfil'} />
                      ) : null}
                      <AvatarFallback className="bg-emerald-500/10 text-emerald-700 text-xl font-bold">
                        {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                          {displayName || 'WhatsApp Conectado'}
                        </h3>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <Wifi className="h-3 w-3 mr-1" /> Ativo
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono mt-0.5">
                        {formatWhatsAppPhone(displayPhone)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Conectado desde {connectedSince ? formatDate(connectedSince) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectInstance.mutate()}
                      disabled={disconnectInstance.isPending}
                    >
                      <WifiOff className="h-4 w-4 mr-2" />
                      Desconectar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <h3 className="font-semibold text-foreground mb-4 text-lg">Escaneie o QR Code</h3>
                  {qrcode ? (
                    <div className="inline-block p-4 bg-white rounded-xl shadow-md border-2 border-primary/10 mb-4 transition-all hover:scale-105">
                      <img
                        src={qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`}
                        alt="QR Code WhatsApp"
                        className="h-56 w-56"
                      />
                    </div>
                  ) : (
                    <div className="h-56 w-56 mx-auto bg-muted rounded-xl flex items-center justify-center mb-4">
                      <QrCode className="h-12 w-12 text-muted-foreground/30 animate-pulse" />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    Abra o WhatsApp no celular → Dispositivos vinculados → Vincular dispositivo
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => connectInstance.mutate()}
                      disabled={connectInstance.isPending}
                      size="sm"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${connectInstance.isPending ? 'animate-spin' : ''}`} />
                      {connectInstance.isPending ? 'Gerando...' : 'Gerar novo QR Code'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Modelos de mensagem</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Crie textos prontos (com variáveis como nome do cliente e ano-base) para
                reutilizar nos disparos manuais e automáticos via WhatsApp ou e-mail.
              </p>
            </div>
            <Button size="sm" onClick={() => { setEditData(null); setEditorOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo modelo
            </Button>
          </div>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <TemplateList
                templates={templates}
                isLoading={loadingTemplates}
                onEdit={(t) => { setEditData(t); setEditorOpen(true); }}
                onDelete={(id) => setDeleteTemplateId(id)}
                onToggle={(id, ativo) => toggleTemplate.mutate({ id, ativo })}
                onTest={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lembretes" className="mt-4 space-y-4">
          <LembretesTemplateTab />
        </TabsContent>

        <TabsContent value="aviso-cobranca" className="mt-4 space-y-4">
          <AvisoCobrancaTemplateTab />
        </TabsContent>





        <TabsContent value="automacoes" className="mt-4 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Disparos automáticos</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Defina quais modelos serão enviados automaticamente quando algo acontece no
              sistema — por exemplo, quando uma cobrança vence ou um novo cliente é
              cadastrado. Requer WhatsApp conectado e modelos criados.
            </p>
          </div>
          <AutomacoesWhatsAppTab escritorioId={authProfile.escritorioId} isDono={isDono} />
        </TabsContent>
      </Tabs>

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir Instância"
        description="Tem certeza que deseja excluir esta instância WhatsApp? Você precisará criar uma nova e escanear o QR Code novamente."
        onConfirm={() => deleteInstance.mutate(undefined, { onSuccess: () => setConfirmDelete(false) })}
        loading={deleteInstance.isPending}
      />

      <TemplateEditor
        open={editorOpen}
        onOpenChange={(v) => { setEditorOpen(v); if (!v) setEditData(null); }}
        onSave={handleSaveTemplate}
        loading={criarTemplate.isPending || editarTemplate.isPending}
        editData={editData}
      />

      <ConfirmModal
        open={!!deleteTemplateId}
        onOpenChange={(v) => { if (!v) setDeleteTemplateId(null); }}
        title="Excluir Template"
        description="Tem certeza que deseja excluir este template?"
        onConfirm={() => { if (deleteTemplateId) deletarTemplate.mutate(deleteTemplateId, { onSuccess: () => setDeleteTemplateId(null) }); }}
        loading={deletarTemplate.isPending}
      />
    </div>
  );
}
