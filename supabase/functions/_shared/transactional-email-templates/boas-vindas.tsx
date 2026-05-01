import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section, Hr } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface BoasVindasProps {
  nome?: string
  escritorio?: string
  loginUrl?: string
}

const BoasVindasEmail = ({ nome, escritorio, loginUrl }: BoasVindasProps) => (
  <EmailLayout 
    preview={`Bem-vindo ao ${escritorio || SITE_NAME}! Sua plataforma de IR está pronta.`}
    siteName={escritorio || SITE_NAME}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Bem-vindo ao {SITE_NAME}!
    </Heading>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Olá <strong>{nome || 'contribuinte'}</strong>,
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      É um prazer tê-lo(a) conosco! Você agora faz parte do <strong>{escritorio || 'nosso escritório'}</strong> e tem acesso à plataforma mais moderna para gestão de declarações de Imposto de Renda.
    </Text>

    <Text className="text-gray-800 text-[14px] leading-[24px] font-bold">
      O que você pode fazer agora:
    </Text>
    
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0 mb-1 italic">✓ Acompanhar suas declarações em tempo real</Text>
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0 mb-1 italic">✓ Enviar documentos com segurança</Text>
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0 mb-1 italic">✓ Chat direto com seu contador</Text>
    <Text className="text-gray-700 text-[14px] leading-[20px] m-0 italic">✓ Verificar malha fina automaticamente</Text>

    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={loginUrl || 'https://declarair.com.br/login'}
      >
        Acessar Plataforma
      </Button>
    </Section>

    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Qualquer dúvida, estamos à disposição!
    </Text>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Atenciosamente,<br />
      Equipe <strong>{escritorio || SITE_NAME}</strong>
    </Text>
  </EmailLayout>
)

export const template = {
  component: BoasVindasEmail,
  subject: (data: Record<string, unknown>) => `Bem-vindo ao ${data.escritorio || SITE_NAME}!`,
  displayName: 'Boas-vindas',
  previewData: { nome: 'João Silva', escritorio: 'Contabilidade ABC', loginUrl: 'https://declarair.com.br/login' },
} satisfies TemplateEntry

export default BoasVindasEmail
