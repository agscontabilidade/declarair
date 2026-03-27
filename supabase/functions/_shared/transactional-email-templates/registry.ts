/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as boasVindas } from './boas-vindas.tsx'
import { template as conviteColaborador } from './convite-colaborador.tsx'
import { template as conviteCliente } from './convite-cliente.tsx'
import { template as novaDeclaracao } from './nova-declaracao.tsx'
import { template as declaracaoTransmitida } from './declaracao-transmitida.tsx'
import { template as cobrancaVencendo } from './cobranca-vencendo.tsx'
import { template as cobrancaPaga } from './cobranca-paga.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'boas-vindas': boasVindas,
  'convite-colaborador': conviteColaborador,
  'convite-cliente': conviteCliente,
  'nova-declaracao': novaDeclaracao,
  'declaracao-transmitida': declaracaoTransmitida,
  'cobranca-vencendo': cobrancaVencendo,
  'cobranca-paga': cobrancaPaga,
}
