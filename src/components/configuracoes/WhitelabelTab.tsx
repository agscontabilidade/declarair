import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Palette, Upload, Eye, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Escritorio = Tables<'escritorios'>;

interface Props {
  escritorioId: string;
  isDono: boolean;
}

export function WhitelabelTab({ escritorioId, isDono }: Props) {
  const queryClient = useQueryClient();

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

  const [corPrimaria, setCorPrimaria] = useState('#1E3A5F');
  const [corFundo, setCorFundo] = useState('#F8FAFC');
  const [nomePortal, setNomePortal] = useState('');
  const [textoBoasVindas, setTextoBoasVindas] = useState('');
  const [whitelabelAtivo, setWhitelabelAtivo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (escritorio) {
      setCorPrimaria(escritorio.cor_primaria || '#1E3A5F');
      setCorFundo(escritorio.cor_fundo_portal || '#F8FAFC');
      setNomePortal(escritorio.nome_portal || '');
      setTextoBoasVindas(escritorio.texto_boas_vindas || '');
      setWhitelabelAtivo(escritorio.whitelabel_ativo || false);
    }
  }, [escritorio]);

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
      queryClient.invalidateQueries({ queryKey: ['escritorio-brand'] });
    } catch {
      toast.error('Erro ao fazer upload do logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!isDono) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('escritorios')
        .update({
          cor_primaria: corPrimaria,
          cor_fundo_portal: corFundo,
          nome_portal: nomePortal || null,
          texto_boas_vindas: textoBoasVindas || null,
          whitelabel_ativo: whitelabelAtivo,
        })
        .eq('id', escritorioId);
      if (error) throw error;
      toast.success('Configurações de marca salvas!');
      queryClient.invalidateQueries({ queryKey: ['escritorio-brand'] });
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
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
            <p className="text-xs text-muted-foreground">Recomendado: 400×120px, PNG com fundo transparente</p>
            <div className="flex items-center gap-4">
              {escritorio?.logo_url ? (
                <img src={escritorio.logo_url} alt="Logo" className="h-12 max-w-[200px] object-contain border rounded-lg p-2" />
              ) : (
                <div className="h-12 w-[200px] border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                  Sem logo
                </div>
              )}
              <label className="cursor-pointer">
                <input type="file" accept=".png,.svg,.jpg,.jpeg" className="hidden" onChange={handleLogoUpload} disabled={!isDono} />
                <Button variant="outline" size="sm" asChild disabled={uploadingLogo || !isDono}>
                  <span><Upload className="h-4 w-4 mr-1" /> {uploadingLogo ? 'Enviando...' : 'Upload'}</span>
                </Button>
              </label>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cor Primária</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={corPrimaria}
                  onChange={e => setCorPrimaria(e.target.value)}
                  className="h-10 w-10 rounded cursor-pointer border"
                  disabled={!isDono}
                />
                <Input value={corPrimaria} onChange={e => setCorPrimaria(e.target.value)} className="flex-1" readOnly={!isDono} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor de Fundo do Portal</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={corFundo}
                  onChange={e => setCorFundo(e.target.value)}
                  className="h-10 w-10 rounded cursor-pointer border"
                  disabled={!isDono}
                />
                <Input value={corFundo} onChange={e => setCorFundo(e.target.value)} className="flex-1" readOnly={!isDono} />
              </div>
            </div>
          </div>

          {/* Portal name */}
          <div className="space-y-2">
            <Label>Nome exibido no Portal do Cliente</Label>
            <Input
              value={nomePortal}
              onChange={e => setNomePortal(e.target.value)}
              placeholder={`Portal do Cliente — ${escritorio?.nome || 'Seu Escritório'}`}
              readOnly={!isDono}
            />
          </div>

          {/* Welcome text */}
          <div className="space-y-2">
            <Label>Texto de boas-vindas no portal</Label>
            <Textarea
              value={textoBoasVindas}
              onChange={e => setTextoBoasVindas(e.target.value)}
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
              checked={whitelabelAtivo}
              onCheckedChange={setWhitelabelAtivo}
              disabled={!isDono}
            />
          </div>

          {/* Preview */}
          <Card className="border-2 border-dashed">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> Preview
              </p>
              <div className="rounded-lg p-4" style={{ backgroundColor: corFundo }}>
                <div className="flex items-center gap-2 mb-3">
                  {escritorio?.logo_url ? (
                    <img src={escritorio.logo_url} alt="" className="h-8 object-contain" />
                  ) : (
                    <div className="h-8 w-8 rounded" style={{ backgroundColor: corPrimaria }} />
                  )}
                  <span className="font-bold text-sm" style={{ color: corPrimaria }}>
                    {nomePortal || `Portal — ${escritorio?.nome || 'Escritório'}`}
                  </span>
                </div>
                <div className="h-8 rounded" style={{ backgroundColor: corPrimaria, opacity: 0.8 }} />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving || !isDono} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Configurações de Marca'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
