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
  Briefcase,
  Banknote,
  Paperclip,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';

type Tipo = 'declaracao' | 'recibo' | 'mei' | 'darf';

interface Props {
  declaracaoId: string;
  escritorioId: string;
  arquivoUrl: string | null;
  arquivoNome: string | null;
  arquivoReciboUrl: string | null;
  arquivoReciboNome: string | null;
  reciboValidadoEm: string | null;
  arquivoMeiUrl?: string | null;
  arquivoMeiNome?: string | null;
  meiValidadoEm?: string | null;
  arquivoDarfUrl?: string | null;
  arquivoDarfNome?: string | null;
  darfValidadoEm?: string | null;
}

export function AnexarDeclaracaoButton({
  declaracaoId,
  escritorioId,
  arquivoUrl,
  arquivoNome,
  arquivoReciboUrl,
  arquivoReciboNome,
  reciboValidadoEm,
  arquivoMeiUrl,
  arquivoMeiNome,
  meiValidadoEm,
  arquivoDarfUrl,
  arquivoDarfNome,
  darfValidadoEm,
}: Props) {
  const queryClient = useQueryClient();
  const inputRefs: Record<Tipo, React.RefObject<HTMLInputElement>> = {
    declaracao: useRef<HTMLInputElement>(null),
    recibo: useRef<HTMLInputElement>(null),
    mei: useRef<HTMLInputElement>(null),
    darf: useRef<HTMLInputElement>(null),
  };
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
      } else if (data?.tipo === 'mei') {
        toast.success('Declaração MEI validada e anexada.');
      } else if (data?.tipo === 'darf') {
        toast.success('DARF validado e anexado.');
      } else {
        toast.success('Recibo anexado.');
      }
      queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracaoId] });
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Erro ao enviar arquivo')),
    onSettled: () => setProcessandoTipo(null),
  });

  async function baixar(path: string | null | undefined) {
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

  const transmitida = !!reciboValidadoEm;

  type SecaoConfig = {
    tipo: Tipo;
    titulo: string;
    icone: React.ReactNode;
    url: string | null | undefined;
    nome: string | null | undefined;
    validado: boolean;
    descricao?: string;
  };

  const secoes: SecaoConfig[] = [
    {
      tipo: 'declaracao',
      titulo: 'Declaração (PDF)',
      icone: <FileText className="h-3.5 w-3.5" />,
      url: arquivoUrl,
      nome: arquivoNome,
      validado: !!arquivoUrl,
    },
    {
      tipo: 'recibo',
      titulo: 'Recibo da Receita (PDF)',
      icone: <Receipt className="h-3.5 w-3.5" />,
      url: arquivoReciboUrl,
      nome: arquivoReciboNome,
      validado: !!arquivoReciboUrl && transmitida,
      descricao: 'Ao validar o recibo, a declaração será marcada como transmitida e o cliente notificado.',
    },
    {
      tipo: 'mei',
      titulo: 'Declaração MEI (DASN-SIMEI)',
      icone: <Briefcase className="h-3.5 w-3.5" />,
      url: arquivoMeiUrl,
      nome: arquivoMeiNome,
      validado: !!meiValidadoEm,
    },
    {
      tipo: 'darf',
      titulo: 'DARF do IRPF (PDF)',
      icone: <Banknote className="h-3.5 w-3.5" />,
      url: arquivoDarfUrl,
      nome: arquivoDarfNome,
      validado: !!darfValidadoEm,
    },
  ];

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
      {secoes.map((s) => (
        <input
          key={s.tipo}
          ref={inputRefs[s.tipo]}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => onSelect(s.tipo, e)}
        />
      ))}

      {(() => {
        const anexados = secoes.filter((s) => !!s.url).length;
        const total = secoes.length;
        return (
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
                    Arquivos OK · {anexados}/{total}
                  </>
                ) : anexados > 0 ? (
                  <>
                    <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                    Arquivos · {anexados}/{total}
                    <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Anexar arquivos
                    <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3 w-3 text-emerald-600" /> Validação inteligente
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

          {secoes.map((s, idx) => {
            const anexado = !!s.url;
            const processando = processandoTipo === s.tipo;
            return (
              <div key={s.tipo}>
                {idx > 0 && <DropdownMenuSeparator />}
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium mb-1.5">
                    {s.icone} {s.titulo}
                    {s.validado && (
                      <FileCheck2 className="h-3.5 w-3.5 text-emerald-600 ml-auto" />
                    )}
                  </div>
                  {anexado ? (
                    <p className="text-[11px] text-muted-foreground truncate mb-1.5" title={s.nome ?? ''}>
                      {s.nome}
                    </p>
                  ) : s.descricao ? (
                    <p className="text-[11px] text-muted-foreground mb-1.5">{s.descricao}</p>
                  ) : null}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                      onClick={() => inputRefs[s.tipo].current?.click()}
                      disabled={processando}
                    >
                      {processando ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                      <span className="ml-1">{anexado ? 'Substituir' : 'Anexar'}</span>
                    </Button>
                    {anexado && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => baixar(s.url)}
                        title="Baixar"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
        );
      })()}
    </div>
  );
}
