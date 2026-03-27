import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface BoasVindasProps {
  nome?: string
  escritorio?: string
  loginUrl?: string
}

const BoasVindasEmail = ({ nome, escritorio, loginUrl }: BoasVindasProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Bem-vindo ao {escritorio || SITE_NAME}! Sua plataforma de IR está pronta.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>🎉 Bem-vindo ao {SITE_NAME}!</Heading>
        </Section>

        <Text style={text}>
          Olá <strong>{nome || 'contribuinte'}</strong>,
        </Text>

        <Text style={text}>
          É um prazer tê-lo(a) conosco! Você agora faz parte do <strong>{escritorio || 'nosso escritório'}</strong> e tem acesso à plataforma mais moderna para gestão de declarações de Imposto de Renda.
        </Text>

        <Text style={text}><strong>O que você pode fazer agora:</strong></Text>
        <Text style={listItem}>✓ Acompanhar suas declarações em tempo real</Text>
        <Text style={listItem}>✓ Enviar documentos com segurança</Text>
        <Text style={listItem}>✓ Chat direto com seu contador</Text>
        <Text style={listItem}>✓ Verificar malha fina automaticamente</Text>

        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl || 'https://declarair.com.br/login'}>
            Acessar Plataforma
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          Qualquer dúvida, estamos à disposição!
        </Text>
        <Text style={text}>
          Atenciosamente,<br />
          Equipe <strong>{escritorio || SITE_NAME}</strong>
        </Text>

        <Text style={footer}>
          {SITE_NAME} — Gestão Inteligente de IR para Escritórios Contábeis
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BoasVindasEmail,
  subject: (data: Record<string, any>) => `Bem-vindo ao ${data.escritorio || SITE_NAME}!`,
  displayName: 'Boas-vindas',
  previewData: { nome: 'João Silva', escritorio: 'Contabilidade ABC', loginUrl: 'https://declarair.com.br/login' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { backgroundColor: '#1A4F9C', padding: '30px 20px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 12px' }
const listItem = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 4px', paddingLeft: '12px' }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#00C6FF', color: '#1A4F9C', fontWeight: 'bold', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }
const hr = { borderTop: '1px solid #e0e0e0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', textAlign: 'center' as const, margin: '30px 0 0' }
