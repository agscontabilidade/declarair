import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, Save, RotateCcw, History, AlertTriangle, 
  Info, Shield, Package, Bell, Search, Edit3, Key
} from 'lucide-react';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [newValue, setNewValue] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['admin-system-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_configs' as any)
        .select('*')
        .order('category', { ascending: true });
      if (error) throw error;
      return data as any[];
    }
  });

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['admin-system-config-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_config_logs' as any)
        .select('*, config:system_configs(key), user:usuarios(nome)')
        .order('changed_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as any[];
    }
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, value, old_value, reason }: any) => {
      // 1. Atualizar configuração
      const { error: updateError } = await supabase
        .from('system_configs' as any)
        .update({ 
          value,
          updated_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);
      
      if (updateError) throw updateError;

      // 2. Registrar no log
      const { error: logError } = await supabase
        .from('system_config_logs' as any)
        .insert({
          config_id: id,
          old_value,
          new_value: value,
          changed_by: (await supabase.auth.getUser()).data.user?.id,
          change_reason: reason
        });
      
      if (logError) throw logError;
    },
    onSuccess: () => {
      toast.success('Configuração atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-system-configs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-system-config-logs'] });
      setEditingConfig(null);
      setNewValue('');
      setChangeReason('');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    }
  });

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    setNewValue(typeof config.value === 'object' ? JSON.stringify(config.value, null, 2) : String(config.value));
  };

  const handleSave = () => {
    if (!editingConfig) return;
    
    let parsedValue: any = newValue;
    try {
      // Tentar parsear se parecer JSON
      if (newValue.startsWith('{') || newValue.startsWith('[') || newValue === 'true' || newValue === 'false' || !isNaN(Number(newValue))) {
        parsedValue = JSON.parse(newValue);
      }
    } catch (e) {
      // Manter como string se falhar o parse
    }

    updateConfig.mutate({
      id: editingConfig.id,
      value: parsedValue,
      old_value: editingConfig.value,
      reason: changeReason
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Shield className="h-4 w-4" />;
      case 'plans': return <Package className="h-4 w-4" />;
      case 'notifications': return <Bell className="h-4 w-4" />;
      case 'api': return <Key className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const filteredConfigs = configs?.filter(c => {
    const matchesTab = activeTab === 'all' || c.category === activeTab;
    const matchesSearch = c.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (c.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações Globais</h1>
            <p className="text-muted-foreground text-sm mt-1">Gerencie variáveis críticas e limites do sistema</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => queryClient.invalidateQueries()}>
            <RotateCcw className="h-4 w-4" /> Atualizar
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="api">APIs</TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" /> Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Alterações</CardTitle>
                <CardDescription>Rastreabilidade de quem alterou o quê</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingLogs ? (
                    <div className="h-32 flex items-center justify-center">Carregando...</div>
                  ) : logs?.map((log: any) => (
                    <div key={log.id} className="flex gap-4 p-4 rounded-lg border bg-muted/30">
                      <div className="p-2 rounded-full bg-primary/10 h-fit">
                        <Edit3 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">
                            {log.user?.nome || 'Admin'} alterou <code className="bg-muted px-1 rounded">{log.config?.key}</code>
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.changed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground italic">"{log.change_reason || 'Sem motivo especificado'}"</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="p-2 bg-red-500/5 border border-red-500/10 rounded text-[10px] overflow-auto max-h-24">
                            <p className="font-bold mb-1 uppercase opacity-50">Anterior</p>
                            <pre>{JSON.stringify(log.old_value, null, 2)}</pre>
                          </div>
                          <div className="p-2 bg-green-500/5 border border-green-500/10 rounded text-[10px] overflow-auto max-h-24">
                            <p className="font-bold mb-1 uppercase opacity-50">Novo</p>
                            <pre>{JSON.stringify(log.new_value, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value={activeTab === 'history' ? 'history' : activeTab} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse h-48 bg-muted/50" />
                ))
              ) : filteredConfigs?.map((config: any) => (
                <Card key={config.id} className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <Badge variant="secondary" className="gap-1 capitalize">
                      {getCategoryIcon(config.category)}
                      {config.category}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-mono">{config.key}</CardTitle>
                    <CardDescription>{config.description || 'Sem descrição'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded-md overflow-hidden">
                      <pre className="text-xs font-mono max-h-32 overflow-y-auto">
                        {JSON.stringify(config.value, null, 2)}
                      </pre>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] text-muted-foreground">
                        Última atualização: {format(new Date(config.updated_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => handleEdit(config)}>
                        <Edit3 className="h-3 w-3" /> Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Editar: {editingConfig?.key}
            </DialogTitle>
            <DialogDescription>
              Atenção: Alterações aqui impactam o comportamento global do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Novo Valor (JSON ou String)</Label>
              <Textarea 
                value={newValue} 
                onChange={(e) => setNewValue(e.target.value)}
                className="font-mono min-h-[150px]"
                placeholder='{"chave": "valor"}'
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo da Alteração</Label>
              <Input 
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Ex: Atualização de limites para o período de IR"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingConfig(null)}>Cancelar</Button>
            <Button 
              onClick={handleSave} 
              disabled={updateConfig.isPending || !changeReason.trim()}
              className="gap-2"
            >
              {updateConfig.isPending ? 'Salvando...' : <><Save className="h-4 w-4" /> Salvar Alteração</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
