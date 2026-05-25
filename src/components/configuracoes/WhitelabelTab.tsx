import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Palette, Upload, Eye, Save, RotateCcw, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Tables } from '@/integrations/supabase/types';

type Escritorio = Tables<'escritorios'>;

interface Props {
  escritorioId: string;
  isDono: boolean;
}

const SYSTEM_DEFAULTS = {
  corPrimaria: '#1E3A5F',
  corFundo: '#F8FAFC',
  nomePortal: '',
  textoBoasVindas: '',
  whitelabelAtivo: false,
};

export function WhitelabelTab({ escritorioId, isDono }: Props) {
  const queryClient = useQueryClient();

  // Cleanup de chave antiga do usePersistedForm (causava bug de hidratação)
  useEffect(() => {
    try {
      localStorage.removeItem(`form_persistence_whitelabel_${escritorioId}`);
    } catch {
      // ignore
    }
  }, [escritorioId]);

  const { data: escritorio, isLoading } = useQuery({
    queryKey: ['escritorio-brand', escritorioId],
    queryFn: async (): Promise<Escritorio | null> => {
      const { data, error } = await supabase
        .from('escritorios')
        .select('*')
        .eq('id', escritorioId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!escritorioId,
  });

  const [form, setForm] = useState(SYSTEM_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [resetting, setResetting] = useState(false);

  const setFormField = (field: keyof typeof SYSTEM_DEFAULTS, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Sempre que os dados do banco mudarem, sincroniza o form
  useEffect(() => {
    if (escritorio) {
      setForm({
        corPrimaria: escritorio.cor_primaria || SYSTEM_DEFAULTS.corPrimaria,
        corFundo: escritorio.cor_fundo_portal || SYSTEM_DEFAULTS.corFundo,
        nomePortal: escritorio.nome_portal || '',
        textoBoasVindas: escritorio.texto_boas_vindas || '',
        whitelabelAtivo: escritorio.whitelabel_ativo || false,
      });
    }
  }, [escritorio?.id, escritorio?.cor_primaria, escritorio?.cor_fundo_portal, escritorio?.nome_portal, escritorio?.texto_boas_vindas, escritorio?.whitelabel_ativo]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Use PNG, JPG, SVG ou WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${escritorioId}/logo_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('logos-escritorios')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from('logos-escritorios')
        .getPublicUrl(path);

      const { error: updateErr } = await supabase
        .from('escritorios')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', escritorioId);
      if (updateErr) throw updateErr;

      toast.success('Logo atualizado!');
      queryClient.invalidateQueries({ queryKey: ['escritorio-brand', escritorioId] });
    } catch {
      toast.error('Erro ao fazer upload do logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!isDono) return;
    setRemovingLogo(true);
    try {
      const { error } = await supabase
        .from('escritorios')
        .update({ logo_url: null })
        .eq('id', escritorioId);
      if (error) throw error;
      toast.success('Logo removido.');
      queryClient.invalidateQueries({ queryKey: ['escritorio-brand', escritorioId] });
    } catch {
      toast.error('Erro ao remover logo');
    } finally {
      setRemovingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!isDono) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('escritorios')
        .update({
          cor_primaria: form.corPrimaria,
          cor_fundo_portal: form.corFundo,
          nome_portal: form.nomePortal || null,
          texto_boas_vindas: form.textoBoasVindas || null,
          whitelabel_ativo: form.whitelabelAtivo,
        })
        .eq('id', escritorioId);
      if (error) throw error;
      toast.success('Configurações de marca salvas!');
      queryClient.invalidateQueries({ queryKey: ['escritorio-brand', escritorioId] });
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!isDono) return;
    setResetting(true);
    try {
      const { error } = await supabase
        .from('escritorios')
        .update({
          cor_primaria: null,
          cor_fundo_portal: null,
          nome_portal: null,
          texto_boas_vindas: null,
          whitelabel_ativo: false,
        })
        .eq('id', escritorioId);
      if (error) throw error;
      setForm(SYSTEM_DEFAULTS);
      toast.success('Padrão do sistema restaurado.');
      queryClient.invalidateQueries({ queryKey: ['escritorio-brand', escritorioId] });
    } catch {
      toast.error('Erro ao restaurar padrão');
    } finally {
      setResetting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="h-5 w-5 text-accent" />
            Marca & Whitelabel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 max-w-lg">
          {/* Logo */}
          <div className="space-y-2">
            <Label>Logo do Escritório</Label>
            <p className="text-xs text-muted-foreground">Recomendado: 400×120px · PNG, JPG, SVG ou WebP · Máx. 2MB</p>
            <div className="flex items-center gap-4 flex-wrap">
              {escritorio?.logo_url ? (
                <img src={escritorio.logo_url} alt="Logo" className="h-12 max-w-[200px] object-contain border rounded-lg p-2" />
              ) : (
                <div className="h-12 w-[200px] border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                  Sem logo
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept=".png,.jpg,.jpeg,.svg,.webp" className="hidden" onChange={handleLogoUpload} disabled={!isDono} />
                <Button variant="outline" size="sm" asChild disabled={uploadingLogo || !isDono}>
                  <span><Upload className="h-4 w-4 mr-1" /> {uploadingLogo ? 'Enviando...' : 'Upload'}</span>
                </Button>
              </label>
              {escritorio?.logo_url && isDono && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={removingLogo} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> {removingLogo ? 'Removendo...' : 'Remover logo'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover logo do escritório?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O portal do cliente voltará a exibir o nome do escritório no lugar do logo. Você poderá enviar um novo logo a qualquer momento.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRemoveLogo}>Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.corPrimaria}
                  onChange={e => setFormField('corPrimaria', e.target.value)}
                  className="h-10 w-10 rounded cursor-pointer border"
                  disabled={!isDono}
                />
                <Input value={form.corPrimaria} onChange={e => setFormField('corPrimaria', e.target.value)} className="flex-1" readOnly={!isDono} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor de Fundo do Portal</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.corFundo}
                  onChange={e => setFormField('corFundo', e.target.value)}
                  className="h-10 w-10 rounded cursor-pointer border"
                  disabled={!isDono}
                />
                <Input value={form.corFundo} onChange={e => setFormField('corFundo', e.target.value)} className="flex-1" readOnly={!isDono} />
              </div>
            </div>
          </div>

          {/* Portal name */}
          <div className="space-y-2">
            <Label>Nome exibido no Portal do Cliente</Label>
            <Input
              value={form.nomePortal}
              onChange={e => setFormField('nomePortal', e.target.value)}
              placeholder={`Portal do Cliente — ${escritorio?.nome || 'Seu Escritório'}`}
              readOnly={!isDono}
            />
          </div>

          {/* Welcome text */}
          <div className="space-y-2">
            <Label>Texto de boas-vindas no portal</Label>
            <Textarea
              value={form.textoBoasVindas}
              onChange={e => setFormField('textoBoasVindas', e.target.value)}
              placeholder="Bem-vindo ao portal! Aqui você acompanha sua declaração de IR."
              rows={3}
              readOnly={!isDono}
            />
          </div>

          {/* Whitelabel toggle */}
          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <p className="text-sm font-medium">Ocultar branding DeclaraIR</p>
              <p className="text-xs text-muted-foreground">Remove a marca DeclaraIR do portal do cliente</p>
            </div>
            <Switch
              checked={form.whitelabelAtivo}
              onCheckedChange={v => setFormField('whitelabelAtivo', v)}
              disabled={!isDono}
            />
          </div>

          {/* Preview */}
          <Card className="border-2 border-dashed">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> Preview
              </p>
              <div className="rounded-lg p-4" style={{ backgroundColor: form.corFundo }}>
                <div className="flex items-center gap-2 mb-3">
                  {escritorio?.logo_url ? (
                    <img src={escritorio.logo_url} alt="" className="h-8 object-contain" />
                  ) : (
                    <div className="h-8 w-8 rounded" style={{ backgroundColor: form.corPrimaria }} />
                  )}
                  <span className="font-bold text-sm" style={{ color: form.corPrimaria }}>
                    {form.nomePortal || `Portal — ${escritorio?.nome || 'Escritório'}`}
                  </span>
                </div>
                <div className="h-8 rounded" style={{ backgroundColor: form.corPrimaria, opacity: 0.8 }} />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleSave} disabled={saving || !isDono} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Configurações de Marca'}
            </Button>

            {isDono && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={resetting} className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    {resetting ? 'Restaurando...' : 'Restaurar padrão do sistema'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restaurar padrão do sistema?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isto vai remover suas cores personalizadas, o nome exibido no portal, o texto de boas-vindas e desativar o whitelabel. O logo enviado é mantido — use o botão "Remover logo" se quiser apagá-lo separadamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetDefaults}>Restaurar padrão</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
