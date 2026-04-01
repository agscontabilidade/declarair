import { supabase } from '@/integrations/supabase/client';

const statusLabels: Record<string, string> = {
  aguardando_documentos: 'Aguardando Documentos',
  documentacao_recebida: 'Documentação Recebida',
  declaracao_pronta: 'Declaração Pronta',
  transmitida: 'Transmitida',
};

export async function triggerStatusAutomation(
  escritorioId: string,
  declaracaoId: string,
  newStatus: string,
  accessToken: string
) {
  try {
    const { data: configs } = await supabase
      .from('configuracoes_escritorio')
      .select('chave, valor')
      .eq('escritorio_id', escritorioId)
      .in('chave', [
        `whatsapp_auto_${newStatus}_ativo`,
        `whatsapp_auto_${newStatus}_template`,
      ]);

    if (!configs || configs.length === 0) return;

    const ativoConfig = configs.find(c => c.chave === `whatsapp_auto_${newStatus}_ativo`);
    const templateConfig = configs.find(c => c.chave === `whatsapp_auto_${newStatus}_template`);

    if (ativoConfig?.valor !== 'true' || !templateConfig?.valor) return;

    const { data: decl } = await supabase
      .from('declaracoes')
      .select('*, clientes(nome, telefone, cpf)')
      .eq('id', declaracaoId)
      .single();

    if (!decl?.clientes) return;
    const clienteData = decl.clientes as unknown as { nome: string; telefone: string; cpf: string };
    if (!clienteData.telefone) return;

    const { data: tmpl } = await supabase
      .from('templates_mensagem')
      .select('id, corpo')
      .eq('id', templateConfig.valor)
      .eq('ativo', true)
      .single();

    if (!tmpl) return;

    const { data: esc } = await supabase
      .from('escritorios')
      .select('nome')
      .eq('id', escritorioId)
      .single();

    const mensagem = tmpl.corpo
      .replace(/{nome_cliente}/g, clienteData.nome || '')
      .replace(/{nome_escritorio}/g, esc?.nome || '')
      .replace(/{ano_base}/g, String(decl.ano_base))
      .replace(/{status_declaracao}/g, statusLabels[newStatus] || newStatus)
      .replace(/{tipo_resultado}/g, decl.tipo_resultado || '')
      .replace(/{valor_resultado}/g, decl.valor_resultado ? String(decl.valor_resultado) : '')
      .replace(/{numero_recibo}/g, decl.numero_recibo || '')
      .replace(/{link_portal}/g, 'https://declarair.lovable.app/cliente/login');

    const phone = clienteData.telefone.replace(/\D/g, '');
    const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    await fetch(`https://${projectId}.supabase.co/functions/v1/whatsapp-service?action=send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        phone: fullPhone,
        message: mensagem,
        clienteId: decl.cliente_id,
        templateId: tmpl.id,
      }),
    });
  } catch {
    // Silent fail - don't block Kanban move
  }
}

export async function createInAppNotification(escritorioId: string, declaracaoId: string, newStatus: string) {
  try {
    const { data: decl } = await supabase
      .from('declaracoes')
      .select('ano_base, clientes(nome)')
      .eq('id', declaracaoId)
      .single();

    if (!decl) return;

    const clienteNome = decl?.clientes ? (decl.clientes as unknown as { nome: string }).nome : 'Cliente';

    await supabase.from('notificacoes').insert({
      escritorio_id: escritorioId,
      titulo: `Declaração movida: ${clienteNome}`,
      mensagem: `A declaração ${decl.ano_base} foi movida para "${statusLabels[newStatus] || newStatus}".`,
      link_destino: `/declaracoes/${declaracaoId}`,
    });
  } catch {
    // Silent
  }
}
