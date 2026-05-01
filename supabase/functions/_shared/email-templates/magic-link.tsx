import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <EmailLayout 
    preview={`Seu link de acesso ao ${siteName}`}
    siteName={siteName}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Link de Acesso
    </Heading>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Você solicitou um link para acessar sua conta no <strong>{siteName}</strong> sem precisar digitar sua senha.
    </Text>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Clique no botão abaixo para entrar agora:
    </Text>
    
    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={confirmationUrl}
      >
        Acessar Agora
      </Button>
    </Section>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Ou copie e cole este link em seu navegador: <br />
      <Link href={confirmationUrl} className="text-brand break-all text-[12px]">
        {confirmationUrl}
      </Link>
    </Text>
    
    <Text className="text-gray-500 text-[12px] leading-[24px] mt-4">
      Este link expira em breve por segurança. Se você não solicitou este acesso, ignore este email.
    </Text>
  </EmailLayout>
)

export default MagicLinkEmail
