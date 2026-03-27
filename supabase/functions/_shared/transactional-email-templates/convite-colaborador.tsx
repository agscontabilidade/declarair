import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'DeclaraIR'

interface ConviteColaboradorProps {
  nome?: string
  escritorio?: string
  convidadoPor?: string
  papel?: string
  linkConvite?: string
}

const ConviteColaboradorEmail = ({ nome, escritorio, convidadoPor, papel, linkConvite }: ConviteColaboradorProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado(a) para integrar a equipe do {escritorio || 'escritório'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>👥 Convite para a Equipe</Heading>
        </Section>

        <Text style={text}>
          Olá <strong>{nome || 'profissional'}</strong>,
        </Text>

        <Text style={text}>
          <strong>{convidadoPor || 'O responsável técnico'}</strong> convidou você para fazer parte da equipe do <strong>{escritorio || 'escritório'}</strong> no {SITE_NAME} como <strong>{papel || 'Profissional Contábil'}</strong>.
        </Text>

        <Text style={text}>
          Com o {SITE_NAME}, você poderá gerenciar declarações de IR dos contribuintes de forma ágil e organizada.
        </Text>

        <Section style={buttonContainer}>
          <Button style={button} href={linkConvite || '#'}>
            Aceitar Convite
          </Button>
        </Section>

        <Section style={warningBox}>
          <Text style={warningText}>
            ⏰ <strong>Atenção:</strong> Este convite expira em 7 dias. Após aceitar, você criará sua senha de acesso.
          </Text>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          Atenciosamente,<br />
          Equipe <strong>{escritorio || SITE_NAME}</strong>
        </Text>

        <Text style={footer}>{SITE_NAME} — Gestão Inteligente de IR para Escritórios Contábeis</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ConviteColaboradorEmail,
  subject: (data: Record<string, any>) => `${data.escritorio || 'Escritório'} — Convite para a equipe`,
  displayName: 'Convite de colaborador',
  previewData: { nome: 'Maria Souza', escritorio: 'Contabilidade ABC', convidadoPor: 'Carlos Lima', papel: 'Profissional Contábil', linkConvite: 'https://declarair.com.br/convite/abc123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '600px', margin: '0 auto' }
const headerSection = { backgroundColor: '#1A4F9C', padding: '30px 20px', borderRadius: '8px 8px 0 0', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 12px' }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: '#00C6FF', color: '#1A4F9C', fontWeight: 'bold', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }
const warningBox = { backgroundColor: '#FFF8E1', borderLeft: '4px solid #F59E0B', padding: '12px 16px', margin: '16px 0', borderRadius: '4px' }
const warningText = { fontSize: '13px', color: '#92400E', margin: '0' }
const hr = { borderTop: '1px solid #e0e0e0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', textAlign: 'center' as const, margin: '30px 0 0' }
