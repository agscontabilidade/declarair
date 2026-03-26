import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PORTAL_BASE_URL } from '@/lib/constants';

const DEFAULT_TEMPLATES = [
  {
    nome: 'Boas-vindas ao Portal',
    canal: 'whatsapp' as const,
    corpo: 'Olá {nome_cliente}! Seu acesso ao portal do {nome_escritorio} está pronto: {link_portal}\n\nCrie sua senha e envie seus documentos com segurança.',
  },
  {
    nome: 'Documentação Pendente',
    canal: 'whatsapp' as const,
    corpo: 'Olá {nome_cliente}! Ainda há documentos pendentes para sua declaração {ano_base}. Acesse: {link_portal}',
  },
  {
    nome: 'Declaração Transmitida',
    canal: 'whatsapp' as const,
    corpo: 'Olá {nome_cliente}! Sua declaração {ano_base} foi transmitida! {tipo_resultado}: R$ {valor_resultado}. Recibo: {numero_recibo}',
  },
];

export const AVAILABLE_TAGS = [
  '{nome_cliente}', '{cpf_cliente}', '{ano_base}', '{status_declaracao}',
  '{tipo_resultado}', '{valor_resultado}', '{data_transmissao}', '{numero_recibo}',
  '{nome_contador}', '{nome_escritorio}', '{link_portal}', '{link_convite}',
];

const MOCK_DATA: Record<string, string> = {
  '{nome_cliente}': 'João Silva',
  '{cpf_cliente}': '123.456.789-00',
  '{ano_base}': '2025',
  '{status_declaracao}': 'Transmitida',
  '{tipo_resultado}': 'Restituição',
  '{valor_resultado}': '2.450,00',
  '{data_transmissao}': '15/03/2025',
  '{numero_recibo}': 'ABC1234567890',
  '{nome_contador}': 'Maria Contadora',
  '{nome_escritorio}': 'Escritório Modelo',
  '{link_portal}': `${PORTAL_BASE_URL}/cliente/login`,
  '{link_convite}': `${PORTAL_BASE_URL}/cliente/convite/TOKEN`,
  '{valor_cobranca}': 'R$ 350,00',
  '{data_vencimento}': '30/04/2025',
  '{status_cobranca}': 'Pendente',

export function replaceTags(text: string, data: Record<string, string> = MOCK_DATA): string {
  let result = text;
  for (const [tag, value] of Object.entries(data)) {
    result = result.split(tag).join(value);
  }
  return result;
}

export function useMensagens() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const escritorioId = profile.escritorioId;

  // Seed default templates
  useQuery({
    queryKey: ['templates-seed', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return null;
      const { count } = await supabase
        .from('templates_mensagem')
        .select('id', { count: 'exact', head: true })
        .eq('escritorio_id', escritorioId);
      if (count === 0) {
        await supabase.from('templates_mensagem').insert(
          DEFAULT_TEMPLATES.map((t) => ({ ...t, escritorio_id: escritorioId }))
        );
        queryClient.invalidateQueries({ queryKey: ['templates'] });
      }
      return true;
    },
    enabled: !!escritorioId,
    staleTime: Infinity,
  });

  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['templates', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return [];
      const { data, error } = await supabase
        .from('templates_mensagem')
        .select('*')
        .eq('escritorio_id', escritorioId)
        .order('created_at');
      if (error) throw error;
      return data || [];
    },
    enabled: !!escritorioId,
  });

  const { data: mensagens = [], isLoading: loadingMensagens } = useQuery({
    queryKey: ['mensagens-enviadas', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return [];
      const { data, error } = await supabase
        .from('mensagens_enviadas')
        .select('*, clientes(nome)')
        .eq('escritorio_id', escritorioId)
        .order('enviado_em', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!escritorioId,
  });

  const criarTemplate = useMutation({
    mutationFn: async (data: { nome: string; canal: string; assunto?: string; corpo: string }) => {
      if (!escritorioId) throw new Error('Sem escritório');
      const { error } = await supabase.from('templates_mensagem').insert({ ...data, escritorio_id: escritorioId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template criado');
    },
    onError: () => toast.error('Erro ao criar template'),
  });

  const editarTemplate = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nome?: string; canal?: string; assunto?: string; corpo?: string }) => {
      const { error } = await supabase.from('templates_mensagem').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template atualizado');
    },
    onError: () => toast.error('Erro ao atualizar template'),
  });

  const toggleTemplate = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('templates_mensagem').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
    onError: () => toast.error('Erro ao atualizar template'),
  });

  const deletarTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('templates_mensagem').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template excluído');
    },
    onError: () => toast.error('Erro ao excluir template'),
  });

  const enviarMensagem = useMutation({
    mutationFn: async (data: { cliente_id: string; template_id?: string; canal: string; conteudo_final: string }) => {
      if (!escritorioId) throw new Error('Sem escritório');
      const { error } = await supabase.from('mensagens_enviadas').insert({
        ...data,
        escritorio_id: escritorioId,
        template_id: data.template_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens-enviadas'] });
      toast.success('Mensagem registrada');
    },
    onError: () => toast.error('Erro ao registrar mensagem'),
  });

  return {
    templates, loadingTemplates, mensagens, loadingMensagens,
    criarTemplate, editarTemplate, toggleTemplate, deletarTemplate, enviarMensagem,
  };
}
