import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface NovaDeclaracaoProps {
  nomeCliente?: string
  nomeEscritorio?: string
  anoBase?: string
  linkPortal?: string
}

const NovaDeclaracaoEmail = ({ nomeCliente, nomeEscritorio, anoBase, linkPortal }: NovaDeclaracaoProps) => (
  <EmailLayout 
    preview={`Sua declaração IRPF ${anoBase || '2025'} foi criada — ${nomeEscritorio || 'seu escritório'}`}
    siteName={nomeEscritorio || SITE_NAME}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Declaração Criada
    </Heading>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Olá <strong>{nomeCliente || 'contribuinte'}</strong>,
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Informamos que o <strong>{nomeEscritorio || 'seu escritório contábil'}</strong> iniciou a preparação da sua <strong>Declaração de Imposto de Renda {anoBase || '2025'}</strong> em nossa plataforma.
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px] font-bold">
      Próximos passos:
    </Text>
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0 mb-1 italic">1️⃣ Envie os documentos necessários pelo portal</Text>
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0 mb-1 italic">2️⃣ Preencha o formulário com seus dados fiscais</Text>
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0 italic">3️⃣ Acompanhe o andamento em tempo real</Text>

    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={linkPortal || 'https://declarair.com.br/cliente/dashboard'}
      >
        Acessar Portal do Contribuinte
      </Button>
    </Section>

    <Section className="bg-emerald-50 border border-emerald-200 rounded-lg p-[16px] my-[24px]">
      <Text className="text-emerald-800 text-[13px] leading-[20px] m-0">
        📌 <strong>Dica:</strong> Quanto antes você enviar os documentos, mais rápido sua declaração ficará pronta para transmissão.
      </Text>
    </Section>

    <Text className="text-gray-800 text-[14px] leading-[24px] mt-4">
      Atenciosamente,<br />
      <strong>{nomeEscritorio || SITE_NAME}</strong>
    </Text>
  </EmailLayout>
)

export const template = {
  component: NovaDeclaracaoEmail,
  subject: (data: Record<string, unknown>) => `Sua declaração IRPF ${data.anoBase || '2025'} foi criada`,
  displayName: 'Nova declaração criada',
  previewData: { nomeCliente: 'João Silva', nomeEscritorio: 'Contabilidade ABC', anoBase: '2025', linkPortal: 'https://declarair.com.br/cliente/dashboard' },
} satisfies TemplateEntry

export default NovaDeclaracaoEmail
