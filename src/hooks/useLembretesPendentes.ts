import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ClientePendente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  declaracao_id: string;
  ano_base: number;
  ultima_atualizacao_status: string;
  ultimo_lembrete_em: string | null;
  ultimo_lembrete_canal: 'email' | 'whatsapp' | null;
}

// Limita concorrência de chamadas async (storage list por cliente).
async function runInBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size);
    const res = await Promise.all(slice.map(fn));
    out.push(...res);
  }
  return out;
}

export function useLembretesPendentes() {
  const { profile } = useAuth();
  const escritorioId = profile?.escritorioId;
  const anoCorrente = new Date().getFullYear();

  return useQuery({
    queryKey: ['lembretes-pendentes', escritorioId, anoCorrente],
    queryFn: async (): Promise<ClientePendente[]> => {
      if (!escritorioId) return [];

      const { data: decls, error } = await supabase
        .from('declaracoes')
        .select(`
          id, ano_base, status, ultima_atualizacao_status,
          arquivos_outros,
          arquivo_declaracao_url, arquivo_recibo_url, arquivo_darf_url,
          arquivo_mei_url, arquivo_analise_caixa_url,
          cliente:clientes!inner(id, nome, email, telefone, escritorio_id)
        `)
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', anoCorrente)
        .eq('status', 'aguardando_documentos');
      if (error) throw error;

      const rowsAll = (decls || []).map((d) => {
        const c = Array.isArray(d.cliente) ? d.cliente[0] : d.cliente;
        const arquivosOutros = Array.isArray(d.arquivos_outros) ? d.arquivos_outros : [];
        const temArquivoDireto = !!(
          d.arquivo_declaracao_url ||
          d.arquivo_recibo_url ||
          d.arquivo_darf_url ||
          d.arquivo_mei_url ||
          d.arquivo_analise_caixa_url
        );
        return {
          id: c?.id as string,
          nome: c?.nome as string,
          email: (c?.email as string | null) ?? null,
          telefone: (c?.telefone as string | null) ?? null,
          declaracao_id: d.id as string,
          ano_base: d.ano_base as number,
          ultima_atualizacao_status: d.ultima_atualizacao_status as string,
          ultimo_lembrete_em: null as string | null,
          ultimo_lembrete_canal: null as ClientePendente['ultimo_lembrete_canal'],
          _temArquivoDireto: temArquivoDireto,
          _temArquivosOutros: arquivosOutros.length > 0,
        };
      });

      if (rowsAll.length === 0) return [];

      const declaracaoIds = rowsAll.map((r) => r.declaracao_id);
      const clienteIds = Array.from(new Set(rowsAll.map((r) => r.id)));

      // 1) checklist_documentos com documento entregue
      const { data: checklist } = await supabase
        .from('checklist_documentos')
        .select('declaracao_id, status, arquivo_url')
        .in('declaracao_id', declaracaoIds);

      const declsComChecklist = new Set<string>();
      for (const ck of checklist || []) {
        if (ck.status === 'recebido' || ck.arquivo_url) {
          declsComChecklist.add(ck.declaracao_id);
        }
      }

      // 2) storage: objetos sob {escritorio_id}/{cliente_id}/ (ignorando .ocr.pdf)
      const storageHits = await runInBatches(clienteIds, 8, async (clienteId) => {
        try {
          const { data, error: stErr } = await supabase.storage
            .from('documentos-clientes')
            .list(`${escritorioId}/${clienteId}`, { limit: 100 });
          if (stErr) return { clienteId, hasFile: false };
          const files = (data || []).filter((o) => o.name && !o.name.endsWith('.ocr.pdf') && o.id !== null);
          // Se houver subpastas, varre 1 nível adicional (ex.: /geral)
          if (files.length === 0) {
            const subdirs = (data || []).filter((o) => o.id === null);
            for (const sub of subdirs) {
              const { data: sd } = await supabase.storage
                .from('documentos-clientes')
                .list(`${escritorioId}/${clienteId}/${sub.name}`, { limit: 50 });
              const subFiles = (sd || []).filter((o) => o.name && !o.name.endsWith('.ocr.pdf') && o.id !== null);
              if (subFiles.length > 0) return { clienteId, hasFile: true };
            }
          }
          return { clienteId, hasFile: files.length > 0 };
        } catch {
          return { clienteId, hasFile: false };
        }
      });
      const clientesComStorage = new Set(storageHits.filter((s) => s.hasFile).map((s) => s.clienteId));

      // Filtra: remove qualquer cliente com sinal de documento
      const rowsFiltrados = rowsAll.filter((r) => {
        const temDoc =
          r._temArquivoDireto ||
          r._temArquivosOutros ||
          declsComChecklist.has(r.declaracao_id) ||
          clientesComStorage.has(r.id);
        if (temDoc) {
          console.info('[lembretes] cliente removido (já possui documentos):', r.nome, {
            arquivoDireto: r._temArquivoDireto,
            arquivosOutros: r._temArquivosOutros,
            checklist: declsComChecklist.has(r.declaracao_id),
            storage: clientesComStorage.has(r.id),
          });
        }
        return !temDoc;
      });

      // 3) último lembrete enviado (apenas para clientes que sobraram)
      const clienteIdsRestantes = rowsFiltrados.map((r) => r.id);
      if (clienteIdsRestantes.length > 0) {
        const { data: lembretes } = await supabase
          .from('lembretes_enviados')
          .select('cliente_id, canal, enviado_em')
          .eq('escritorio_id', escritorioId)
          .in('cliente_id', clienteIdsRestantes)
          .order('enviado_em', { ascending: false });
        const map = new Map<string, { canal: 'email' | 'whatsapp'; enviado_em: string }>();
        for (const l of lembretes || []) {
          if (!map.has(l.cliente_id)) {
            map.set(l.cliente_id, { canal: l.canal as 'email' | 'whatsapp', enviado_em: l.enviado_em });
          }
        }
        for (const r of rowsFiltrados) {
          const found = map.get(r.id);
          if (found) {
            r.ultimo_lembrete_em = found.enviado_em;
            r.ultimo_lembrete_canal = found.canal;
          }
        }
      }

      // Remove campos internos antes de retornar
      const rows: ClientePendente[] = rowsFiltrados.map(({ _temArquivoDireto, _temArquivosOutros, ...rest }) => rest);
      rows.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      return rows;
    },
    enabled: !!escritorioId,
    staleTime: 60_000,
  });
}
