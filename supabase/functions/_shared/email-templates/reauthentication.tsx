import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section } from 'npm:@react-email/components@0.0.22'
import EmailLayout from '../email-layout.tsx'

interface ReauthenticationEmailProps { token: string }

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailLayout 
    preview="Seu código de verificação"
  >
    <Heading className="text-gray-900 text-[20px] font-bold text-center p-0 my-[30px] mx-0">
      Verificação de Segurança
    </Heading>
    
    <Text className="text-gray-800 text-[14px] leading-[24px] text-center">
      Para prosseguir com sua ação, utilize o código de segurança abaixo:
    </Text>
    
    <Section className="bg-gray-100 rounded-lg p-[24px] my-[32px] text-center">
      <Text className="font-mono text-[32px] font-bold tracking-[6px] m-0 text-brand">
        {token}
      </Text>
    </Section>
    
    <Text className="text-gray-500 text-[12px] leading-[24px] text-center">
      Este código expira em breve por sua segurança. <br />
      Se você não solicitou esta verificação, ignore este email.
    </Text>
  </EmailLayout>
)

export default ReauthenticationEmail
