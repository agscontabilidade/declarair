import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'

interface RecoveryEmailProps { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <EmailLayout 
    preview={`Redefinir sua senha — ${siteName}`}
    siteName={siteName}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Redefinir sua Senha
    </Heading>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Recebemos uma solicitação para redefinir a senha da sua conta no <strong>{siteName}</strong>.
    </Text>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Clique no botão abaixo para criar uma nova senha:
    </Text>
    
    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={confirmationUrl}
      >
        Redefinir Senha
      </Button>
    </Section>
    
    <Section className="bg-[#FFF8E1] border-l-4 border-[#F59E0B] p-[12px] my-[16px] rounded">
      <Text className="text-[#92400E] text-[13px] leading-[20px] m-0">
        ⚠️ Se você não solicitou essa alteração, ignore este email. Sua senha permanecerá a mesma. Este link expira em 1 hora.
      </Text>
    </Section>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Se precisar de ajuda, entre em contato com nosso suporte.
    </Text>
  </EmailLayout>
)

export default RecoveryEmail
