import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'

interface InviteEmailProps { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <EmailLayout 
    preview={`Você foi convidado(a) para o ${siteName}`}
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Você foi convidado(a)!
    </Heading>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Olá,
    </Text>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Você recebeu um convite para fazer parte do <strong>{siteName}</strong>, a plataforma de gestão inteligente de IR.
    </Text>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Clique no botão abaixo para aceitar o convite e configurar seu acesso:
    </Text>
    
    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={confirmationUrl}
      >
        Aceitar Convite
      </Button>
    </Section>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Ou utilize o link abaixo: <br />
      <Link href={confirmationUrl} className="text-brand break-all text-[12px]">
        {confirmationUrl}
      </Link>
    </Text>
    
    <Text className="text-gray-500 text-[12px] leading-[24px] mt-4">
      Se você não esperava este convite, pode ignorar este email.
    </Text>
  </EmailLayout>
)

export default InviteEmail
