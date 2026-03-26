import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, MessageSquare, AlertCircle } from 'lucide-react';
import { useMensagens } from '@/hooks/useMensagens';
import { TemplateList } from '@/components/mensagens/TemplateList';
import { TemplateEditor } from '@/components/mensagens/TemplateEditor';
import { TestarMensagemModal } from '@/components/mensagens/TestarMensagemModal';
import { ConfirmModal } from '@/components/cobrancas/ConfirmModal';
import { formatDate } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { useWhatsAppStatus } from '@/hooks/useWhatsApp';
import { Link } from 'react-router-dom';

export default function Mensagens() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown> | null>(null);
  const [testTemplate, setTestTemplate] = useState<Record<string, unknown> | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: whatsappStatus } = useWhatsAppStatus();
  const isWhatsAppConnected = whatsappStatus?.status === 'connected';

  const {
    templates, loadingTemplates, mensagens, loadingMensagens,
    criarTemplate, editarTemplate, toggleTemplate, deletarTemplate, enviarMensagem,
  } = useMensagens();

  const handleSave = (data: Record<string, unknown>) => {
    if (data.id) {
      editarTemplate.mutate(data, { onSuccess: () => { setEditorOpen(false); setEditData(null); } });
    } else {
      criarTemplate.mutate(data, { onSuccess: () => { setEditorOpen(false); setEditData(null); } });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Mensagens</h1>
          <Button onClick={() => { setEditData(null); setEditorOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Novo Template
          </Button>
        </div>

        {!isWhatsAppConnected && (
          <Alert className="border-warning/30 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              Para enviar mensagens via WhatsApp, conecte seu número primeiro.{' '}
              <Link to="/whatsapp" className="font-semibold underline">Conectar WhatsApp →</Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Templates */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateList
              templates={templates}
              isLoading={loadingTemplates}
              onEdit={(t) => { setEditData(t); setEditorOpen(true); }}
              onDelete={(id) => setDeleteId(id)}
              onToggle={(id, ativo) => toggleTemplate.mutate({ id, ativo })}
              onTest={(t) => {
                if (t.canal === 'whatsapp' && !isWhatsAppConnected) {
                  return; // blocked
                }
                setTestTemplate(t);
              }}
            />
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Envios</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMensagens ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : mensagens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Nenhuma mensagem enviada ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mensagens.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Badge variant="outline" className="shrink-0">{m.canal === 'whatsapp' ? 'WhatsApp' : 'Email'}</Badge>
                      <span className="text-sm font-medium shrink-0">{'—'}</span>
                      <span className="text-sm text-muted-foreground truncate">{m.conteudo_final.slice(0, 100)}...</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatDate(m.enviado_em)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TemplateEditor
        open={editorOpen}
        onOpenChange={(v) => { setEditorOpen(v); if (!v) setEditData(null); }}
        onSave={handleSave}
        loading={criarTemplate.isPending || editarTemplate.isPending}
        editData={editData}
      />

      {testTemplate && (
        <TestarMensagemModal
          open={!!testTemplate}
          onOpenChange={(v) => { if (!v) setTestTemplate(null); }}
          template={testTemplate}
          onEnviar={(clienteId, conteudo) => {
            enviarMensagem.mutate({
              cliente_id: clienteId,
              template_id: testTemplate.id,
              canal: testTemplate.canal,
              conteudo_final: conteudo,
            });
          }}
        />
      )}

      <ConfirmModal
        open={!!deleteId}
        onOpenChange={(v) => { if (!v) setDeleteId(null); }}
        title="Excluir Template"
        description="Tem certeza que deseja excluir este template?"
        onConfirm={() => { if (deleteId) deletarTemplate.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
        loading={deletarTemplate.isPending}
      />
    </DashboardLayout>
  );
}
