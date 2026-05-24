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
  Plus,
  X,
} from 'lucide-react';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { ConfirmarDocumentoManualDialog, type ManualConfirmacaoPayload } from './ConfirmarDocumentoManualDialog';


type Tipo = 'declaracao' | 'recibo' | 'mei' | 'darf';

export interface OutroDocumento {
  path: string;
  nome: string;
  uploaded_at: string;
}

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
  arquivosOutros?: OutroDocumento[] | null;
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
  arquivosOutros,
}: Props) {

  const queryClient = useQueryClient();
  const inputRefs: Record<Tipo, React.RefObject<HTMLInputElement>> = {
    declaracao: useRef<HTMLInputElement>(null),
    recibo: useRef<HTMLInputElement>(null),
    mei: useRef<HTMLInputElement>(null),
    darf: useRef<HTMLInputElement>(null),
  };
  const [processandoTipo, setProcessandoTipo] = useState<Tipo | null>(null);
  const [manualReview, setManualReview] = useState<{
    tipo: Tipo;
    storage_path: string;
    arquivo_nome: string;
    motivo: string;
  } | null>(null);

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
      // Backend pediu confirmação manual — não apaga o arquivo e abre o modal
      if (!data?.ok && data?.requires_manual_review) {
        setManualReview({
          tipo,
          storage_path: data.storage_path || path,
          arquivo_nome: data.arquivo_nome || file.name,
          motivo: data.motivo || 'Não foi possível validar automaticamente.',
        });
        return { __manualReview: true };
      }
      if (!data?.ok) {
        await supabase.storage.from('documentos-clientes').remove([path]);
        throw new Error(data?.motivo || 'PDF rejeitado pela validação');
      }
      return data;
    },
    onSuccess: (data) => {
      if (data?.__manualReview) {
        // Apenas abre o modal — não exibe toast de sucesso ainda
        return;
      }
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

  const confirmManual = useMutation({
    mutationFn: async (payload: ManualConfirmacaoPayload) => {
      if (!manualReview) throw new Error('Sem revisão pendente');
      const { data, error: fnErr } = await supabase.functions.invoke('processar-pdf-declaracao', {
        body: {
          declaracao_id: declaracaoId,
          tipo: manualReview.tipo,
          storage_path: manualReview.storage_path,
          arquivo_nome: manualReview.arquivo_nome,
          manual_confirmacao: payload,
        },
      });
      if (fnErr) throw new Error(fnErr.message || 'Erro ao confirmar manualmente');
      if (!data?.ok) throw new Error(data?.motivo || 'Confirmação rejeitada');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.virouTransmitida
        ? 'Recibo confirmado! Declaração marcada como Transmitida.'
        : 'Documento registrado com a confirmação manual.');
      setManualReview(null);
      queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracaoId] });
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Erro ao confirmar manualmente')),
  });


  const outrosInputRef = useRef<HTMLInputElement>(null);
  const [outrosBusy, setOutrosBusy] = useState(false);
  const outrosLista: OutroDocumento[] = Array.isArray(arquivosOutros) ? arquivosOutros : [];

  const uploadOutros = useMutation({
    mutationFn: async (files: File[]) => {
      setOutrosBusy(true);
      const novos: OutroDocumento[] = [];
      for (const file of files) {
        if (file.size > 18 * 1024 * 1024) {
          throw new Error(`"${file.name}" excede 18MB`);
        }
        const safeName = file.name.replace(/[^\w.\-]/g, '_');
        const path = `${escritorioId}/declaracoes/${declaracaoId}/outros-${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from('documentos-clientes')
          .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' });
        if (upErr) throw new Error(upErr.message);
        novos.push({ path, nome: file.name, uploaded_at: new Date().toISOString() });
      }
      const merged = [...outrosLista, ...novos];
      const { error } = await supabase
        .from('declaracoes')
        .update({ arquivos_outros: merged as unknown as never })
        .eq('id', declaracaoId);
      if (error) throw new Error(error.message);
      return novos.length;
    },
    onSuccess: (n) => {
      toast.success(n === 1 ? 'Documento anexado.' : `${n} documentos anexados.`);
      queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracaoId] });
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Erro ao anexar documento')),
    onSettled: () => setOutrosBusy(false),
  });

  const removerOutro = useMutation({
    mutationFn: async (path: string) => {
      setOutrosBusy(true);
      await supabase.storage.from('documentos-clientes').remove([path]);
      const filtered = outrosLista.filter((o) => o.path !== path);
      const { error } = await supabase
        .from('declaracoes')
        .update({ arquivos_outros: filtered as unknown as never })
        .eq('id', declaracaoId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Documento removido.');
      queryClient.invalidateQueries({ queryKey: ['declaracoes-lista'] });
      queryClient.invalidateQueries({ queryKey: ['declaracao', declaracaoId] });
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e, 'Erro ao remover documento')),
    onSettled: () => setOutrosBusy(false),
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

  function onSelectOutros(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) uploadOutros.mutate(files);
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
        const temDecl = !!arquivoUrl;
        const temRecibo = !!arquivoReciboUrl;
        const ambos = temDecl && temRecibo;
        const parcial = (temDecl || temRecibo) && !ambos;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant={ambos ? 'default' : 'outline'}
                disabled={upload.isPending}
                className={
                  ambos
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : parcial
                      ? 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800'
                      : ''
                }
              >
                {upload.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Validando...
                  </>
                ) : ambos ? (
                  <>
                    Anexados
                    <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
                  </>
                ) : parcial ? (
                  <>
                    Anexado parcial
                    <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
                  </>
                ) : (
                  <>
                    Anexar
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

          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2 text-xs font-medium mb-1.5">
              <Paperclip className="h-3.5 w-3.5" /> Outros documentos
              <span className="ml-auto text-[10px] font-normal text-muted-foreground">
                sem validação
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-1.5">
              Documentos diversos (ações, comprovantes etc.) anexados ao e-mail enviado ao cliente.
            </p>
            <input
              ref={outrosInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={onSelectOutros}
            />
            {outrosLista.length > 0 && (
              <ul className="mb-1.5 space-y-1">
                {outrosLista.map((o) => (
                  <li
                    key={o.path}
                    className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-1.5 py-1 text-[11px]"
                  >
                    <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate" title={o.nome}>{o.nome}</span>
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => baixar(o.path)}
                      title="Baixar"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      onClick={() => removerOutro.mutate(o.path)}
                      disabled={outrosBusy}
                      title="Remover"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
              onClick={() => outrosInputRef.current?.click()}
              disabled={outrosBusy}
            >
              {outrosBusy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
              <span className="ml-1">Anexar documento</span>
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

        );
      })()}

      {manualReview && (
        <ConfirmarDocumentoManualDialog
          open={!!manualReview}
          onOpenChange={(v) => { if (!v) setManualReview(null); }}
          tipo={manualReview.tipo}
          motivo={manualReview.motivo}
          isSubmitting={confirmManual.isPending}
          onConfirm={(payload) => confirmManual.mutate(payload)}
        />
      )}
    </div>
  );
}

