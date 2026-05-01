import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface ConviteColaboradorProps {
  nome?: string
  escritorio?: string
  convidadoPor?: string
  papel?: string
  linkConvite?: string
}

const ConviteColaboradorEmail = ({ nome, escritorio, convidadoPor, papel, linkConvite }: ConviteColaboradorProps) => (
  <EmailLayout 
    preview={`Você foi convidado(a) para integrar a equipe do ${escritorio || 'escritório'}`}
    siteName={escritorio || SITE_NAME}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Convite de Equipe
    </Heading>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Olá <strong>{nome || 'profissional'}</strong>,
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      <strong>{convidadoPor || 'O responsável técnico'}</strong> convidou você para fazer parte da equipe do escritório <strong>{escritorio || 'nossa contabilidade'}</strong> como <strong>{papel || 'Profissional Contábil'}</strong>.
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Com o {SITE_NAME}, você poderá gerenciar as declarações dos seus clientes com muito mais agilidade e inteligência.
    </Text>

    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={linkConvite || '#'}
      >
        Aceitar Convite
      </Button>
    </Section>

    <Section className="bg-amber-50 border-l-4 border-amber-400 p-[12px] my-[16px] rounded">
      <Text className="text-amber-800 text-[13px] leading-[20px] m-0">
        ⏰ <strong>Atenção:</strong> Este convite expira em 7 dias. Após aceitar, você poderá definir sua senha.
      </Text>
    </Section>

    <Text className="text-gray-800 text-[14px] leading-[24px] mt-4">
      Atenciosamente,<br />
      Equipe <strong>{escritorio || SITE_NAME}</strong>
    </Text>
  </EmailLayout>
)

export const template = {
  component: ConviteColaboradorEmail,
  subject: (data: Record<string, unknown>) => `${data.escritorio || 'Escritório'} — Convite para a equipe`,
  displayName: 'Convite de colaborador',
  previewData: { nome: 'Maria Souza', escritorio: 'Contabilidade ABC', convidadoPor: 'Carlos Lima', papel: 'Profissional Contábil', linkConvite: 'https://declarair.com.br/convite/abc123' },
} satisfies TemplateEntry

export default ConviteColaboradorEmail
