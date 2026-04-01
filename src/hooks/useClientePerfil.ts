import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PORTAL_BASE_URL } from '@/lib/constants';

export function useClientePerfil(clienteId: string | undefined) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const escritorioId = profile.escritorioId;

  const cliente = useQuery({
    queryKey: ['cliente', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*, usuarios!clientes_contador_responsavel_id_fkey(id, nome)')
        .eq('id', clienteId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clienteId,
  });

  const declaracoes = useQuery({
    queryKey: ['cliente-declaracoes', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('declaracoes')
        .select('*, usuarios!declaracoes_contador_id_fkey(nome)')
        .eq('cliente_id', clienteId!)
        .order('ano_base', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clienteId,
  });

  const cobrancas = useQuery({
    queryKey: ['cliente-cobrancas', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('cliente_id', clienteId!)
        .order('data_vencimento', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clienteId,
  });

  const mensagens = useQuery({
    queryKey: ['cliente-mensagens', clienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mensagens_enviadas')
        .select('*')
        .eq('cliente_id', clienteId!)
        .order('enviado_em', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clienteId,
  });

  const contadores = useQuery({
    queryKey: ['contadores', escritorioId],
    queryFn: async () => {
      if (!escritorioId) return [];
      const { data } = await supabase
        .from('usuarios')
        .select('id, nome')
        .eq('escritorio_id', escritorioId)
        .eq('ativo', true);
      return data || [];
    },
    enabled: !!escritorioId,
  });

  /** Generates the invite token + URL. Returns the URL string. */
  async function gerarTokenConvite(): Promise<string> {
    if (!clienteId) throw new Error('Sem cliente');
    const token = crypto.randomUUID();
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 7);

    const { error } = await supabase
      .from('clientes')
      .update({
        token_convite: token,
        token_convite_expira_em: expiraEm.toISOString(),
        status_onboarding: 'convite_enviado',
      })
      .eq('id', clienteId);
    if (error) throw error;

    return `${PORTAL_BASE_URL}/cliente/convite/${token}`;
  }

  /** Try sending invite via WhatsApp edge function */
  async function enviarViaWhatsApp(url: string) {
    const clienteData = cliente.data;
    if (!clienteData?.telefone) return;

    const { data: esc } = await supabase
      .from('escritorios')
      .select('nome')
      .eq('id', escritorioId!)
      .single();

    const { data: tmpl } = await supabase
      .from('templates_mensagem')
      .select('id, corpo')
      .eq('escritorio_id', escritorioId!)
      .eq('canal', 'whatsapp')
      .ilike('nome', '%boas-vindas%')
      .eq('ativo', true)
      .limit(1)
      .maybeSingle();

    const mensagem = tmpl
      ? tmpl.corpo
          .replace(/{nome_cliente}/g, clienteData.nome)
          .replace(/{nome_escritorio}/g, esc?.nome || '')
          .replace(/{link_portal}/g, `${PORTAL_BASE_URL}/cliente/login`)
          .replace(/{link_convite}/g, url)
      : `Olá ${clienteData.nome}! Acesse seu portal de declaração de IR: ${url}`;

    const phone = clienteData.telefone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Sessão expirada');

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(`https://${projectId}.supabase.co/functions/v1/whatsapp-service?action=send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        phone: fullPhone,
        message: mensagem,
        clienteId,
        templateId: tmpl?.id || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Erro ao enviar WhatsApp');
    }
  }

  const enviarConvite = useMutation({
    mutationFn: async (mode: 'auto' | 'copy' | 'email' | 'whatsapp-manual') => {
      const url = await gerarTokenConvite();
      const clienteData = cliente.data;

      switch (mode) {
        case 'auto': {
          // Auto-send via connected WhatsApp
          await enviarViaWhatsApp(url);
          return { mode, url };
        }
        case 'copy': {
          await navigator.clipboard.writeText(url);
          return { mode, url };
        }
        case 'email': {
          const assunto = 'Convite - Declaração de Imposto de Renda';
          const corpo = `Olá ${clienteData?.nome || ''},\n\nAcesse o link abaixo para iniciar sua declaração de IR:\n\n${url}`;
          window.location.href = `mailto:${clienteData?.email || ''}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
          return { mode, url };
        }
        case 'whatsapp-manual': {
          const msg = `Olá ${clienteData?.nome || ''}! Acesse seu portal de declaração de IR: ${url}`;
          const phone = (clienteData?.telefone || '').replace(/\D/g, '');
          const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
          window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, '_blank');
          return { mode, url };
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente', clienteId] });
    },
  });

  const criarDeclaracao = useMutation({
    mutationFn: async (input: { ano_base: number; contador_id: string | null }) => {
      if (!clienteId || !escritorioId) throw new Error('Dados incompletos');

      const { data: decl, error: declError } = await supabase
        .from('declaracoes')
        .insert({
          cliente_id: clienteId,
          escritorio_id: escritorioId,
          ano_base: input.ano_base,
          contador_id: input.contador_id,
        })
        .select()
        .single();
      if (declError) throw declError;

      const checklistItems = [
        { nome_documento: 'Documento de Identidade (RG/CNH)', categoria: 'documentos_pessoais', obrigatorio: true },
        { nome_documento: 'CPF do Titular', categoria: 'documentos_pessoais', obrigatorio: true },
        { nome_documento: 'Comprovante de Endereço Atualizado', categoria: 'documentos_pessoais', obrigatorio: true },
        { nome_documento: 'Título de Eleitor (opcional)', categoria: 'documentos_pessoais', obrigatorio: false },
        { nome_documento: 'Última Declaração Entregue (Recibo)', categoria: 'documentos_pessoais', obrigatorio: false },
      ].map(item => ({ ...item, declaracao_id: decl.id }));

      const { error: checkError } = await supabase
        .from('checklist_documentos')
        .insert(checklistItems);
      if (checkError) throw checkError;

      return decl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-declaracoes', clienteId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['declaracoes'] });
    },
  });

  const marcarPago = useMutation({
    mutationFn: async (cobrancaId: string) => {
      const { error } = await supabase
        .from('cobrancas')
        .update({ status: 'pago', data_pagamento: new Date().toISOString().split('T')[0] })
        .eq('id', cobrancaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-cobrancas', clienteId] });
    },
  });

  const criarCobranca = useMutation({
    mutationFn: async (input: { descricao: string; valor: number; data_vencimento: string; declaracao_id?: string }) => {
      if (!clienteId || !escritorioId) throw new Error('Dados incompletos');
      const { error } = await supabase
        .from('cobrancas')
        .insert({
          cliente_id: clienteId,
          escritorio_id: escritorioId,
          ...input,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cliente-cobrancas', clienteId] });
    },
  });

  return {
    cliente: cliente.data,
    isLoading: cliente.isLoading,
    declaracoes: declaracoes.data ?? [],
    declaracoesLoading: declaracoes.isLoading,
    cobrancas: cobrancas.data ?? [],
    cobrancasLoading: cobrancas.isLoading,
    mensagens: mensagens.data ?? [],
    mensagensLoading: mensagens.isLoading,
    contadores: contadores.data ?? [],
    enviarConvite,
    criarDeclaracao,
    marcarPago,
    criarCobranca,
  };
}
