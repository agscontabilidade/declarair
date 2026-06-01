/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export type EmailTemplateData = Record<string, unknown>

export interface TemplateEntry {
  component: React.ComponentType<EmailTemplateData>
  subject: string | ((data: EmailTemplateData) => string)
  to?: string
  displayName?: string
  previewData?: EmailTemplateData
}

import { template as boasVindas } from './boas-vindas.tsx'
import { template as conviteColaborador } from './convite-colaborador.tsx'
import { template as conviteCliente } from './convite-cliente.tsx'
import { template as novaDeclaracao } from './nova-declaracao.tsx'
import { template as declaracaoTransmitida } from './declaracao-transmitida.tsx'
import { template as cobrancaVencendo } from './cobranca-vencendo.tsx'
import { template as cobrancaPaga } from './cobranca-paga.tsx'
import { template as envioManualDeclaracao } from './envio-manual-declaracao.tsx'
import { template as lembretePrazoIR } from './lembrete-prazo-ir.tsx'
import { template as avisoCobranca } from './aviso-cobranca.tsx'
import { template as processamentoReceitaConfirmado } from './processamento-receita-confirmado.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'boas-vindas': boasVindas,
  'convite-colaborador': conviteColaborador,
  'convite-cliente': conviteCliente,
  'nova-declaracao': novaDeclaracao,
  'declaracao-transmitida': declaracaoTransmitida,
  'cobranca-vencendo': cobrancaVencendo,
  'cobranca-paga': cobrancaPaga,
  'envio-manual-declaracao': envioManualDeclaracao,
  'lembrete-prazo-ir': lembretePrazoIR,
  'aviso-cobranca': avisoCobranca,
  'processamento-receita-confirmado': processamentoReceitaConfirmado,
}
