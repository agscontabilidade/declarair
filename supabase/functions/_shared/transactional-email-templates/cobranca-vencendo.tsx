import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface CobrancaVencendoProps {
  nomeCliente?: string
  nomeEscritorio?: string
  descricao?: string
  valor?: string
  dataVencimento?: string
  linkPagamento?: string
}

const CobrancaVencendoEmail = ({ nomeCliente, nomeEscritorio, descricao, valor, dataVencimento, linkPagamento }: CobrancaVencendoProps) => (
  <EmailLayout 
    preview={`Lembrete: cobrança vencendo em breve — R$ ${valor || '0,00'}`}
    siteName={nomeEscritorio || SITE_NAME}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Cobrança Pendente
    </Heading>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Este é um lembrete amigável sobre uma cobrança que está próxima do vencimento:
    </Text>

    <Section className="bg-amber-50 border border-amber-200 rounded-lg p-[16px] my-[24px]">
      <Text className="text-amber-800 text-[14px] leading-[22px] m-0 mb-2">
        📝 <strong>Descrição:</strong> {descricao || 'Serviço contábil'}
      </Text>
      <Text className="text-amber-800 text-[14px] leading-[22px] m-0 mb-2">
        💰 <strong>Valor:</strong> R$ {valor || '0,00'}
      </Text>
      <Text className="text-amber-800 text-[14px] leading-[22px] m-0">
        📅 <strong>Vencimento:</strong> {dataVencimento || '—'}
      </Text>
    </Section>

    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={linkPagamento || 'https://declarair.com.br/cliente/dashboard'}
      >
        Pagar Agora
      </Button>
    </Section>

    <Section className="bg-red-50 border-l-4 border-red-400 p-[12px] my-[16px] rounded">
      <Text className="text-red-700 text-[13px] leading-[20px] m-0 italic">
        ⚠️ Evite juros e multas realizando o pagamento antes do vencimento. Caso já tenha pago, desconsidere este aviso.
      </Text>
    </Section>

    <Text className="text-gray-800 text-[14px] leading-[24px] mt-4">
      Atenciosamente,<br />
      <strong>{nomeEscritorio || SITE_NAME}</strong>
    </Text>
  </EmailLayout>
)

export const template = {
  component: CobrancaVencendoEmail,
  subject: (data: Record<string, unknown>) => `Lembrete: cobrança de R$ ${data.valor || '0,00'} vencendo em ${data.dataVencimento || 'breve'}`,
  displayName: 'Cobrança vencendo',
  previewData: { nomeCliente: 'João Silva', nomeEscritorio: 'Contabilidade ABC', descricao: 'Declaração IRPF 2025', valor: '350,00', dataVencimento: '15/04/2025', linkPagamento: 'https://declarair.com.br/cliente/dashboard' },
} satisfies TemplateEntry

export default CobrancaVencendoEmail
