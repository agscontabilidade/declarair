import { PlanGate, FeatureGate } from '@/components/billing/BillingGate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Wifi, WifiOff, QrCode, Trash2, RefreshCw, Phone, User, Calendar, Hash, Send } from 'lucide-react';
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

function formatWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    const national = digits.slice(2);
    return `+55 ${formatPhone(national)}`;
  }
  return `+${digits}`;
}

export function WhatsAppConfigTab() {
  const { data: statusData, isLoading, refetch } = useWhatsAppStatus();
  const createInstance = useCreateInstance();
  const connectInstance = useConnectInstance();
  const disconnectInstance = useDisconnectInstance();
  const deleteInstance = useDeleteInstance();
  const { myAddons, catalog } = useAddons();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const whatsappAddon = catalog.find(a => a.nome.toLowerCase().includes('whatsapp'));
  const addonAtivo = whatsappAddon
    ? myAddons.some(a => a.addon_id === whatsappAddon.id && a.status === 'ativo')
    : false;

  const status = statusData?.status || 'not_created';
  const instance = statusData?.instance;
  const qrcode = instance?.qrcode_base64 || statusData?.qrcode;
  const profile = statusData?.profile;
  const msgCount = statusData?.mensagensEnviadas || 0;

  const isConnected = status === 'connected';

  const displayPhone = instance?.phone || profile?.phone;
  const displayName = instance?.profile_name || profile?.profileName;
  const displayPicture = instance?.profile_picture_url || profile?.profilePictureUrl;
  const connectedSince = isConnected && instance?.updated_at ? instance.updated_at : null;

  return (
    <PlanGate requiredPlan="pro" featureName="WhatsApp Integrado">
      <FeatureGate feature="whatsapp">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Conexão WhatsApp</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Conecte seu WhatsApp para enviar mensagens reais aos clientes
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

          {/* Status Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Status da Conexão</CardTitle>
                  <CardDescription>Gerencie sua instância WhatsApp</CardDescription>
                </div>
                <Badge
                  variant={isConnected ? 'default' : 'secondary'}
                  className={isConnected ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                >
                  {isConnected ? (
                    <><Wifi className="h-3 w-3 mr-1" /> Conectado</>
                  ) : status === 'not_created' ? (
                    'Não configurado'
                  ) : (
                    <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-48 w-48 mx-auto" />
                  <Skeleton className="h-10 w-full" />
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
                      <h3 className="font-semibold text-foreground truncate">
                        {displayName || 'WhatsApp Conectado'}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono mt-0.5">
                        {formatWhatsAppPhone(displayPhone)}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-emerald-600 font-medium">Online</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="mb-4" />

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Send className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-bold text-foreground">{msgCount}</p>
                      <p className="text-[10px] text-muted-foreground">Mensagens</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Phone className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground mt-1 truncate">
                        {displayPhone ? displayPhone.slice(-4) : '—'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Final</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-[10px] font-semibold text-foreground mt-1">
                        {connectedSince ? formatDate(connectedSince) : '—'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Desde</p>
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
                  <h3 className="font-semibold text-foreground mb-4">Escaneie o QR Code</h3>
                  {qrcode ? (
                    <div className="inline-block p-4 bg-white rounded-xl shadow-sm border mb-4">
                      <img
                        src={qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`}
                        alt="QR Code WhatsApp"
                        className="h-48 w-48"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-48 mx-auto bg-muted rounded-xl flex items-center justify-center mb-4">
                      <QrCode className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mb-6">
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
        </div>

        <ConfirmModal
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Excluir Instância"
          description="Tem certeza que deseja excluir esta instância WhatsApp? Você precisará criar uma nova e escanear o QR Code novamente."
          onConfirm={() => deleteInstance.mutate(undefined, { onSuccess: () => setConfirmDelete(false) })}
          loading={deleteInstance.isPending}
        />
      </FeatureGate>
    </PlanGate>
  );
}
