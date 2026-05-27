import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface LembretePrazoIRProps {
  nomeCliente?: string
  nomeEscritorio?: string
  prazoFinal?: string
  anoBase?: string | number
  linkPortal?: string
  mensagemPersonalizada?: string
}

const LembretePrazoIREmail = ({
  nomeCliente,
  nomeEscritorio,
  prazoFinal,
  anoBase,
  linkPortal,
  mensagemPersonalizada,
}: LembretePrazoIRProps) => (
  <EmailLayout
    preview={`Lembrete: prazo final da sua declaração de IR ${anoBase || ''} — ${prazoFinal || 'em breve'}`}
    siteName={nomeEscritorio || SITE_NAME}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Prazo final da sua declaração de IR
    </Heading>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Identificamos que ainda <strong>não recebemos a documentação completa</strong> para
      elaborarmos sua declaração de Imposto de Renda{anoBase ? ` (ano-base ${anoBase})` : ''}.
    </Text>

    <Section className="bg-amber-50 border border-amber-200 rounded-lg p-[16px] my-[24px]">
      <Text className="text-amber-900 text-[14px] leading-[22px] m-0">
        📅 <strong>Prazo final para envio dos documentos:</strong> {prazoFinal || '—'}
      </Text>
    </Section>

    {mensagemPersonalizada ? (
      <Section className="bg-gray-50 border-l-4 border-gray-300 p-[12px] my-[16px] rounded">
        <Text className="text-gray-700 text-[13px] leading-[20px] m-0 whitespace-pre-line">
          {mensagemPersonalizada}
        </Text>
      </Section>
    ) : (
      <Text className="text-gray-800 text-[14px] leading-[24px]">
        Para evitar multas e atrasos, envie seus documentos o quanto antes pelo portal abaixo.
      </Text>
    )}

    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={linkPortal || 'https://declarair.com.br/cliente/dashboard'}
      >
        Enviar documentos agora
      </Button>
    </Section>

    <Section className="bg-red-50 border-l-4 border-red-400 p-[12px] my-[16px] rounded">
      <Text className="text-red-700 text-[13px] leading-[20px] m-0 italic">
        ⚠️ A entrega em atraso da declaração gera multa mínima de R$ 165,74, podendo chegar
        a 20% do imposto devido. Não deixe para o último dia.
      </Text>
    </Section>

    <Text className="text-gray-800 text-[14px] leading-[24px] mt-4">
      Atenciosamente,<br />
      <strong>{nomeEscritorio || SITE_NAME}</strong>
    </Text>
  </EmailLayout>
)

export const template = {
  component: LembretePrazoIREmail,
  subject: (data: Record<string, unknown>) =>
    `⏰ Prazo final da sua declaração de IR: ${data.prazoFinal || 'em breve'}`,
  displayName: 'Lembrete de prazo IR',
  previewData: {
    nomeCliente: 'João Silva',
    nomeEscritorio: 'Contabilidade ABC',
    prazoFinal: '31/05/2026',
    anoBase: 2025,
    linkPortal: 'https://declarair.com.br/cliente/dashboard',
    mensagemPersonalizada: 'Por favor, envie seus informes de rendimentos e comprovantes médicos ainda esta semana.',
  },
} satisfies TemplateEntry

export default LembretePrazoIREmail
