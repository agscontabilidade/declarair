/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text, Section } from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefinir sua senha — {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>🔐 Redefinir Senha</Heading>
        </Section>
        <Text style={text}>Recebemos uma solicitação para redefinir a senha da sua conta no {siteName}.</Text>
        <Text style={text}>Clique no botão abaixo para criar uma nova senha:</Text>
        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>Redefinir Senha</Button>
        </Section>
        <Section style={warningBox}>
          <Text style={warningText}>⚠️ Se você não solicitou essa alteração, ignore este email. Sua senha permanecerá a mesma. Este link expira em 1 hora.</Text>
        </Section>
        <Text style={footer}>Equipe {siteName}</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { backgroundColor: '#1A4F9C', padding: '24px 20px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#00C6FF', color: '#1A4F9C', fontSize: '14px', fontWeight: 'bold', borderRadius: '6px', padding: '12px 24px', textDecoration: 'none' }
const warningBox = { backgroundColor: '#FFF8E1', borderLeft: '4px solid #F59E0B', padding: '12px 16px', margin: '16px 0', borderRadius: '4px' }
const warningText = { fontSize: '13px', color: '#92400E', margin: '0' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
