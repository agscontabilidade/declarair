import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface CobrancaPagaProps {
  nomeCliente?: string
  nomeEscritorio?: string
  descricao?: string
  valor?: string
  dataPagamento?: string
}

const CobrancaPagaEmail = ({ nomeCliente, nomeEscritorio, descricao, valor, dataPagamento }: CobrancaPagaProps) => (
  <EmailLayout 
    preview={`✅ Pagamento de R$ ${valor || '0,00'} confirmado — ${nomeEscritorio || SITE_NAME}`}
    siteName={nomeEscritorio || SITE_NAME}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Pagamento Confirmado
    </Heading>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Confirmamos o recebimento do seu pagamento com sucesso. Obrigado!
    </Text>

    <Section className="bg-emerald-50 border border-emerald-200 rounded-lg p-[16px] my-[24px]">
      <Text className="text-emerald-800 text-[14px] leading-[22px] m-0 mb-2">
        📝 <strong>Descrição:</strong> {descricao || 'Serviço contábil'}
      </Text>
      <Text className="text-emerald-800 text-[14px] leading-[22px] m-0 mb-2">
        💰 <strong>Valor pago:</strong> R$ {valor || '0,00'}
      </Text>
      <Text className="text-emerald-800 text-[14px] leading-[22px] m-0">
        📅 <strong>Data do pagamento:</strong> {dataPagamento || '—'}
      </Text>
    </Section>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Este email serve como comprovante de que sua obrigação financeira foi baixada em nosso sistema.
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px] mt-4">
      Atenciosamente,<br />
      <strong>{nomeEscritorio || SITE_NAME}</strong>
    </Text>
  </EmailLayout>
)

export const template = {
  component: CobrancaPagaEmail,
  subject: (data: Record<string, unknown>) => `✅ Pagamento de R$ ${data.valor || '0,00'} confirmado`,
  displayName: 'Cobrança paga',
  previewData: { nomeCliente: 'João Silva', nomeEscritorio: 'Contabilidade ABC', descricao: 'Declaração IRPF 2025', valor: '350,00', dataPagamento: '10/04/2025' },
} satisfies TemplateEntry

export default CobrancaPagaEmail
