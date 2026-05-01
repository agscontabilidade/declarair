import * as React from 'npm:react@18.3.1'
import { Button, Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'

interface SignupEmailProps { 
  siteName: string; 
  siteUrl: string; 
  recipient: string; 
  confirmationUrl: string 
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <EmailLayout 
    preview={`Confirme seu email para acessar o ${siteName}`}
    siteName={siteName}
    siteUrl={siteUrl}
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Confirme seu Email
    </Heading>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Olá,
    </Text>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Obrigado por se cadastrar no <strong>{siteName}</strong>! Estamos felizes em ter você conosco.
    </Text>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Para ativar sua conta e começar a gerenciar suas declarações, confirme seu endereço de email ({recipient}) clicando no botão abaixo:
    </Text>
    
    <Section className="text-center mt-[32px] mb-[32px]">
      <Button
        className="bg-brand rounded text-white text-[14px] font-bold no-underline text-center px-6 py-3"
        href={confirmationUrl}
      >
        Confirmar Email
      </Button>
    </Section>
    
    <Text className="text-gray-800 text-[14px] leading-[24px]">
      Ou copie e cole este link em seu navegador: <br />
      <Link href={confirmationUrl} className="text-brand break-all text-[12px]">
        {confirmationUrl}
      </Link>
    </Text>
    
    <Text className="text-gray-500 text-[12px] leading-[24px] mt-4">
      Se você não criou uma conta, pode ignorar este email com segurança.
    </Text>
  </EmailLayout>
)

export default SignupEmail
