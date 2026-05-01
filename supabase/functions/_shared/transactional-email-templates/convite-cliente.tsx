import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface ConviteClienteProps {
  nomeCliente?: string
  nomeEscritorio?: string
  linkConvite?: string
  mensagemPersonalizada?: string
}

const ConviteClienteEmail = ({ nomeCliente, nomeEscritorio, linkConvite, mensagemPersonalizada }: ConviteClienteProps) => (
  <EmailLayout 
    preview={`Acompanhe sua declaração de IR em tempo real — ${nomeEscritorio || 'seu escritório'}`}
    siteName={nomeEscritorio || SITE_NAME}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Sua Declaração de IR
    </Heading>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      O <strong>{nomeEscritorio || 'seu escritório contábil'}</strong> preparou um acesso exclusivo para você gerenciar e acompanhar sua declaração de Imposto de Renda com total segurança.
    </Text>

    {mensagemPersonalizada && (
      <Section className="bg-blue-50 border-l-4 border-blue-500 p-[16px] my-[24px] rounded">
        <Text className="text-blue-800 text-[14px] leading-[22px] m-0 italic">
          💬 <strong>Mensagem do contador:</strong><br />
          "{mensagemPersonalizada}"
        </Text>
      </Section>
    )}

    <Text className="text-gray-800 text-[14px] leading-[24px] font-bold">
      Com o seu Portal você pode:
    </Text>
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0 mb-1">📊 Acompanhar o status 24h por dia</Text>
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0 mb-1">📤 Enviar documentos digitalizados</Text>
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0 mb-1">💬 Falar direto com seu contador via Chat</Text>
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0">✅ Receber avisos importantes</Text>

    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={linkConvite || '#'}
      >
        Acessar Minha Declaração
      </Button>
    </Section>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Atenciosamente,<br />
      <strong>{nomeEscritorio || SITE_NAME}</strong>
    </Text>
  </EmailLayout>
)

export const template = {
  component: ConviteClienteEmail,
  subject: (data: Record<string, unknown>) => `${data.nomeEscritorio || 'Seu escritório'} — Acesse sua Declaração de IR`,
  displayName: 'Convite de cliente',
  previewData: { nomeCliente: 'Ana Costa', nomeEscritorio: 'Contabilidade ABC', linkConvite: 'https://declarair.com.br/cliente/convite/xyz', mensagemPersonalizada: 'Precisamos dos seus informes de rendimento até dia 15.' },
} satisfies TemplateEntry

export default ConviteClienteEmail
