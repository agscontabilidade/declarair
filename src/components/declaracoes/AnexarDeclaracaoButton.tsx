import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileCheck2, Loader2, Download } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  declaracaoId: string;
  escritorioId: string;
  arquivoUrl: string | null;
  arquivoNome: string | null;
}

export function AnexarDeclaracaoButton({ declaracaoId, escritorioId, arquivoUrl, arquivoNome }: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = useState(false);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (file.type !== 'application/pdf') throw new Error('Envie um arquivo PDF');
      if (file.size > 20 * 1024 * 1024) throw new Error('Tamanho máximo: 20MB');
      const path = `${escritorioId}/declaracoes/${declaracaoId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
      const { error: upErr } = await supabase.storage
        .from('documentos-clientes')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase
        .from('declaracoes')
        .update({
          arquivo_declaracao_url: path,
          arquivo_declaracao_nome: file.name,
          arquivo_declaracao_uploaded_at: new Date().toISOString(),
        })
        .eq('id', declaracaoId);
      if (dbErr) throw dbErr;
    },
    onSuccess: () => {
      toast.success('Declaração anexada');
      queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] });
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao enviar arquivo'),
  });

  async function baixar() {
    if (!arquivoUrl) return;
    try {
      setDownloading(true);
      const { data, error } = await supabase.storage
        .from('documentos-clientes')
        .createSignedUrl(arquivoUrl, 60 * 5);
      if (error || !data?.signedUrl) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch {
      toast.error('Não foi possível abrir');
    } finally {
      setDownloading(false);
    }
  }

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) upload.mutate(f);
    e.target.value = '';
  }

  const anexado = !!arquivoUrl;

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={onSelect} />
      {anexado ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={baixar} disabled={downloading}>
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                <FileCheck2 className="h-3.5 w-3.5 ml-1 text-emerald-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{arquivoNome || 'Declaração anexada'}</TooltipContent>
          </Tooltip>
          <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          </Button>
        </TooltipProvider>
      ) : (
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-1.5" />
          )}
          Anexar PDF
        </Button>
      )}
    </div>
  );
}
