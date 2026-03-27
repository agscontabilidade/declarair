/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Text, Section } from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps { siteName: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração do seu email — {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>📧 Alterar Email</Heading>
        </Section>
        <Text style={text}>
          Você solicitou alterar o email da sua conta no {siteName} de <Link href={`mailto:${email}`} style={link}>{email}</Link> para <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Text style={text}>Clique no botão abaixo para confirmar:</Text>
        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>Confirmar Alteração</Button>
        </Section>
        <Text style={footer}>Se você não solicitou essa alteração, proteja sua conta imediatamente.</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { backgroundColor: '#1A4F9C', padding: '24px 20px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#ffffff', margin: '0' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#1A4F9C', textDecoration: 'underline' }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#00C6FF', color: '#1A4F9C', fontSize: '14px', fontWeight: 'bold', borderRadius: '6px', padding: '12px 24px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
