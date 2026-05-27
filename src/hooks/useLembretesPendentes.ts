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
        .select('id, ano_base, status, ultima_atualizacao_status, cliente:clientes!inner(id, nome, email, telefone, escritorio_id)')
        .eq('escritorio_id', escritorioId)
        .eq('ano_base', anoCorrente)
        .eq('status', 'aguardando_documentos');
      if (error) throw error;

      const rows = (decls || []).map((d) => {
        const c = Array.isArray(d.cliente) ? d.cliente[0] : d.cliente;
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
        };
      });

      const clienteIds = rows.map((r) => r.id);
      if (clienteIds.length > 0) {
        const { data: lembretes } = await supabase
          .from('lembretes_enviados')
          .select('cliente_id, canal, enviado_em')
          .eq('escritorio_id', escritorioId)
          .in('cliente_id', clienteIds)
          .order('enviado_em', { ascending: false });
        const map = new Map<string, { canal: 'email' | 'whatsapp'; enviado_em: string }>();
        for (const l of lembretes || []) {
          if (!map.has(l.cliente_id)) {
            map.set(l.cliente_id, { canal: l.canal as 'email' | 'whatsapp', enviado_em: l.enviado_em });
          }
        }
        for (const r of rows) {
          const found = map.get(r.id);
          if (found) {
            r.ultimo_lembrete_em = found.enviado_em;
            r.ultimo_lembrete_canal = found.canal;
          }
        }
      }

      rows.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      return rows;
    },
    enabled: !!escritorioId,
    staleTime: 60_000,
  });
}
