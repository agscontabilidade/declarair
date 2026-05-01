import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface DeclaracaoTransmitidaProps {
  nomeCliente?: string
  nomeEscritorio?: string
  anoBase?: string
  numeroRecibo?: string
  tipoResultado?: string
  valorResultado?: string
  linkPortal?: string
}

const DeclaracaoTransmitidaEmail = ({ nomeCliente, nomeEscritorio, anoBase, numeroRecibo, tipoResultado, valorResultado, linkPortal }: DeclaracaoTransmitidaProps) => (
  <EmailLayout 
    preview={`🎉 Sua declaração IRPF ${anoBase || '2025'} foi transmitida com sucesso!`}
    siteName={nomeEscritorio || SITE_NAME}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Declaração Transmitida!
    </Heading>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Temos o prazer de informar que sua <strong>Declaração de Imposto de Renda {anoBase || '2025'}</strong> foi transmitida com sucesso para a Receita Federal.
    </Text>

    <Section className="bg-emerald-50 border border-emerald-200 rounded-lg p-[16px] my-[24px]">
      {numeroRecibo && (
        <Text className="text-emerald-800 text-[14px] leading-[22px] m-0 mb-2">
          📋 <strong>Recibo:</strong> {numeroRecibo}
        </Text>
      )}
      {tipoResultado && (
        <Text className="text-emerald-800 text-[14px] leading-[22px] m-0">
          {tipoResultado === 'restituicao' ? '💰' : tipoResultado === 'pagamento' ? '💳' : '✅'}{' '}
          <strong>Resultado:</strong>{' '}
          {tipoResultado === 'restituicao' ? 'Restituição' : tipoResultado === 'pagamento' ? 'Imposto a pagar' : 'Sem saldo'}
          {valorResultado && ` — R$ ${valorResultado}`}
        </Text>
      )}
    </Section>

    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={linkPortal || 'https://declarair.com.br/cliente/dashboard'}
      >
        Ver Detalhes no Portal
      </Button>
    </Section>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Guarde o número do recibo. Você pode baixar a cópia da declaração e o recibo diretamente no seu portal.
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px] mt-4">
      Atenciosamente,<br />
      <strong>{nomeEscritorio || SITE_NAME}</strong>
    </Text>
  </EmailLayout>
)

export const template = {
  component: DeclaracaoTransmitidaEmail,
  subject: (data: Record<string, unknown>) => `🎉 Declaração IRPF ${data.anoBase || '2025'} transmitida com sucesso!`,
  displayName: 'Declaração transmitida',
  previewData: { nomeCliente: 'João Silva', nomeEscritorio: 'Contabilidade ABC', anoBase: '2025', numeroRecibo: '1234.5678.9012-34', tipoResultado: 'restituicao', valorResultado: '2.350,00', linkPortal: 'https://declarair.com.br/cliente/dashboard' },
} satisfies TemplateEntry

export default DeclaracaoTransmitidaEmail
