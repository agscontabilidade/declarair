import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Upload,
  FileCheck2,
  Loader2,
  Download,
  FileText,
  Receipt,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

type Tipo = 'declaracao' | 'recibo';

interface Props {
  declaracaoId: string;
  escritorioId: string;
  arquivoUrl: string | null;
  arquivoNome: string | null;
  arquivoReciboUrl: string | null;
  arquivoReciboNome: string | null;
  reciboValidadoEm: string | null;
}

export function AnexarDeclaracaoButton({
  declaracaoId,
  escritorioId,
  arquivoUrl,
  arquivoNome,
  arquivoReciboUrl,
  arquivoReciboNome,
  reciboValidadoEm,
}: Props) {
  const queryClient = useQueryClient();
  const inputDeclaracaoRef = useRef<HTMLInputElement>(null);
  const inputReciboRef = useRef<HTMLInputElement>(null);
  const [processandoTipo, setProcessandoTipo] = useState<Tipo | null>(null);

  const upload = useMutation({
    mutationFn: async ({ file, tipo }: { file: File; tipo: Tipo }) => {
      if (file.type !== 'application/pdf') throw new Error('Envie um arquivo PDF');
      if (file.size > 18 * 1024 * 1024) throw new Error('Tamanho máximo: 18MB');
      setProcessandoTipo(tipo);
      const safeName = file.name.replace(/[^\w.-]/g, '_');
      const path = `${escritorioId}/declaracoes/${declaracaoId}/${tipo}-${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from('documentos-clientes')
        .upload(path, file, { upsert: true, contentType: 'application/pdf' });
      if (upErr) throw new Error(upErr.message);

      const { data, error: fnErr } = await supabase.functions.invoke('processar-pdf-declaracao', {
        body: {
          declaracao_id: declaracaoId,
          tipo,
          storage_path: path,
          arquivo_nome: file.name,
        },
      });

      if (fnErr) {
        // limpa upload em erro sistêmico
        await supabase.storage.from('documentos-clientes').remove([path]);
        throw new Error(fnErr.message || 'Erro ao processar PDF');
      }
      if (!data?.ok) {
        await supabase.storage.from('documentos-clientes').remove([path]);
        throw new Error(data?.motivo || 'PDF rejeitado pela validação');
      }
      return data;
    },
    onSuccess: (data) => {
      if (data?.virouTransmitida) {
        toast.success('Recibo validado! Declaração marcada como Transmitida e cliente notificado.', {
          duration: 6000,
        });
      } else if (data?.tipo === 'declaracao') {
        toast.success('Declaração validada e anexada.');
      } else {
        toast.success('Recibo anexado.');
      }
      queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] });
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Erro ao enviar arquivo')),
    onSettled: () => setProcessandoTipo(null),
  });

  async function baixar(path: string | null) {
    if (!path) return;
    try {
      const { data, error } = await supabase.storage
        .from('documentos-clientes')
        .createSignedUrl(path, 60 * 5);
      if (error || !data?.signedUrl) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch {
      toast.error('Não foi possível abrir');
    }
  }

  function onSelect(tipo: Tipo, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) upload.mutate({ file: f, tipo });
    e.target.value = '';
  }

  const declAnexada = !!arquivoUrl;
  const recAnexado = !!arquivoReciboUrl;
  const transmitida = !!reciboValidadoEm;

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
      <input
        ref={inputDeclaracaoRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onSelect('declaracao', e)}
      />
      <input
        ref={inputReciboRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onSelect('recibo', e)}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant={transmitida ? 'default' : 'outline'} disabled={upload.isPending}>
            {upload.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Validando...
              </>
            ) : transmitida ? (
              <>
                <FileCheck2 className="h-3.5 w-3.5 mr-1.5" />
                Transmitida
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Anexar
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3 w-3 text-emerald-600" /> Validação automática por IA
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2 text-xs font-medium mb-1.5">
              <FileText className="h-3.5 w-3.5" /> Declaração (PDF)
              {declAnexada && <FileCheck2 className="h-3.5 w-3.5 text-emerald-600 ml-auto" />}
            </div>
            {declAnexada && (
              <p className="text-[11px] text-muted-foreground truncate mb-1.5" title={arquivoNome ?? ''}>
                {arquivoNome}
              </p>
            )}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={() => inputDeclaracaoRef.current?.click()}
                disabled={processandoTipo === 'declaracao'}
              >
                {processandoTipo === 'declaracao' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                <span className="ml-1">{declAnexada ? 'Substituir' : 'Anexar'}</span>
              </Button>
              {declAnexada && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => baixar(arquivoUrl)}
                  title="Baixar"
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <DropdownMenuSeparator />

          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2 text-xs font-medium mb-1.5">
              <Receipt className="h-3.5 w-3.5" /> Recibo da Receita (PDF)
              {recAnexado && transmitida && (
                <FileCheck2 className="h-3.5 w-3.5 text-emerald-600 ml-auto" />
              )}
            </div>
            {recAnexado ? (
              <p className="text-[11px] text-muted-foreground truncate mb-1.5" title={arquivoReciboNome ?? ''}>
                {arquivoReciboNome}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mb-1.5">
                Ao validar o recibo, a declaração será marcada como <strong>transmitida</strong> e o cliente notificado.
              </p>
            )}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs"
                onClick={() => inputReciboRef.current?.click()}
                disabled={processandoTipo === 'recibo'}
              >
                {processandoTipo === 'recibo' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                <span className="ml-1">{recAnexado ? 'Substituir' : 'Anexar'}</span>
              </Button>
              {recAnexado && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => baixar(arquivoReciboUrl)}
                  title="Baixar"
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
