import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'

interface EmailChangeEmailProps { siteName: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <EmailLayout 
    preview={`Confirme a alteração do seu email — ${siteName}`}
    siteName={siteName}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Alteração de Email
    </Heading>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Você solicitou a alteração do endereço de email associado à sua conta no <strong>{siteName}</strong>.
    </Text>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      O email será alterado de <strong>{email}</strong> para <strong>{newEmail}</strong>.
    </Text>
    
    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={confirmationUrl}
      >
        Confirmar Novo Email
      </Button>
    </Section>
    
    <Text className="text-gray-500 text-[12px] leading-[24px] mt-4">
      Se você não solicitou essa alteração, entre em contato com nosso suporte imediatamente para proteger sua conta.
    </Text>
  </EmailLayout>
)

export default EmailChangeEmail
