import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Tailwind,
} from 'npm:@react-email/components@0.0.22'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
  siteName?: string
  siteUrl?: string
}

const LOGO_URL = 'https://bykqurgeptipguqvxwiq.supabase.co/storage/v1/object/public/public-assets/logo.png'

export const EmailLayout = ({
  preview,
  children,
  siteName = 'DeclaraIR',
  siteUrl = 'https://declarair.com.br',
}: EmailLayoutProps) => {
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: '#1E40AF',
                muted: '#6B7280',
              },
            },
          },
        }}
      >
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-[#eaeaea] rounded-lg my-[40px] mx-auto p-[20px] w-[465px] shadow-sm">
            <Section className="mt-[32px] mb-[32px] text-center">
              <Img
                src={LOGO_URL}
                width="180"
                height="auto"
                alt={siteName}
                className="my-0 mx-auto block"
              />
            </Section>
            
            {children}

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            
            <Section className="text-center">
              <Text className="text-[#666666] text-[12px] leading-[24px] mb-2">
                Este email foi enviado por <Link href={siteUrl} className="text-brand font-semibold no-underline">{siteName}</Link>.
              </Text>
              <Text className="text-[#999999] text-[11px] leading-[18px]">
                &copy; {new Date().getFullYear()} {siteName}. Todos os direitos reservados.<br />
                Gestão Inteligente de IR para Escritórios Contábeis.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default EmailLayout
